"""Authentication dependencies for JWT token verification."""

import logging
from typing import Annotated

import jwt
import requests
from fastapi import Depends, HTTPException, Header, status
from jwt.algorithms import RSAAlgorithm

from app.api.v1.depends.settings import get_app_settings

logger = logging.getLogger(__name__)

# Cache for Cognito public keys
_cognito_keys_cache: dict | None = None


def get_cognito_public_keys() -> list[dict]:
    """
    Fetch Cognito User Pool public keys for JWT verification.

    Public key URL format:
    https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json

    Returns:
        List of public keys

    Raises:
        HTTPException: Failed to fetch public keys
    """
    global _cognito_keys_cache

    # Return cached keys if available
    if _cognito_keys_cache is not None:
        return _cognito_keys_cache

    settings = get_app_settings()

    if not settings.cognito_user_pool_id or not settings.aws_region:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cognito configuration not set",
        )

    region = settings.aws_region
    user_pool_id = settings.cognito_user_pool_id

    keys_url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"

    try:
        response = requests.get(keys_url, timeout=10)
        response.raise_for_status()
        keys_data = response.json()
        _cognito_keys_cache = keys_data.get("keys", [])
        logger.info("Successfully fetched Cognito public keys")
        return _cognito_keys_cache
    except requests.RequestException as e:
        logger.error(f"Failed to fetch Cognito public keys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch authentication keys",
        )


def verify_cognito_token(token: str) -> dict:
    """
    Verify Cognito JWT Token.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload containing user information

    Raises:
        HTTPException: Token is invalid or expired
    """
    settings = get_app_settings()

    try:
        # Decode JWT header to get kid (Key ID)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing kid",
            )

        # Fetch public keys
        keys = get_cognito_public_keys()

        # Find matching public key
        public_key = None
        for key in keys:
            if key.get("kid") == kid:
                # Convert JWK to public key using PyJWT's RSAAlgorithm
                public_key = RSAAlgorithm.from_jwk(key)
                break

        if not public_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: key not found",
            )

        # Verify token
        # Audience should be Cognito Client ID
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=settings.cognito_client_id,
            options={"verify_exp": True, "verify_aud": True},
        )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    """
    Get current authenticated user from Authorization header.

    This dependency validates JWT token and returns user information.
    Used for endpoints that require mandatory authentication.

    Args:
        authorization: Authorization header (Bearer token)

    Returns:
        User information dictionary containing:
        - user_id: Cognito user ID (sub)
        - email: User email
        - name: User name
        - email_verified: Whether email is verified

    Raises:
        HTTPException: Not authenticated or invalid token
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract token
    try:
        scheme, token = authorization.split(maxsplit=1)
        if scheme.lower() != "bearer":
            raise ValueError("Invalid scheme")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify token
    payload = verify_cognito_token(token)

    # Extract user information
    user_info = {
        "user_id": payload.get("sub"),  # Cognito user ID
        "email": payload.get("email"),
        "name": payload.get("name", payload.get("email")),  # Fallback to email if name not set
        "email_verified": payload.get("email_verified", False),
        "username": payload.get("cognito:username", payload.get("email")),
    }

    if not user_info["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
        )

    logger.info(f"User authenticated: {user_info['email']}")
    return user_info


async def get_optional_user(
    authorization: Annotated[str | None, Header()] = None,
) -> dict | None:
    """
    Optional user authentication (does not require login).

    If valid token is provided, validates and returns user information.
    If no token is provided or token is invalid, returns None.

    Used for endpoints with optional authentication (e.g., public review lists
    that can show additional info for authenticated users).

    Args:
        authorization: Authorization header (Bearer token)

    Returns:
        User information dictionary or None
    """
    if not authorization:
        return None

    try:
        return await get_current_user(authorization)
    except HTTPException:
        # Token invalid, return None (don't raise exception)
        return None

