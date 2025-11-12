"""AWS RDS PostgreSQL client module."""

from collections.abc import Generator
from contextlib import contextmanager
from typing import Any

from sqlalchemy import Engine, create_engine, event, exc, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import Pool

from app.settings.rds_settings import RDSSettings


class RDSClient:
    """AWS RDS PostgreSQL client with connection pooling."""

    def __init__(self, settings: RDSSettings) -> None:
        """
        Initialize RDS client with database settings.

        Args:
            settings: Database configuration settings
        """
        self._settings = settings
        self._engine: Engine | None = None
        self._session_factory: sessionmaker[Session] | None = None

    def _create_engine(self) -> Engine:
        """
        Create SQLAlchemy engine with connection pooling.

        Returns:
            Configured SQLAlchemy engine
        """
        engine = create_engine(
            self._settings.database_url,
            pool_size=self._settings.pool_size,
            max_overflow=self._settings.pool_max_overflow,
            pool_timeout=self._settings.pool_timeout,
            pool_recycle=self._settings.pool_recycle,
            pool_pre_ping=True,  # Verify connections before using them
            echo=False,  # Set to True for SQL query logging in development
        )

        # Add connection pool event listeners
        self._setup_pool_listeners(engine.pool)

        return engine

    def _setup_pool_listeners(self, pool: Pool) -> None:
        """
        Set up connection pool event listeners.

        Args:
            pool: SQLAlchemy connection pool
        """

        @event.listens_for(pool, "connect")
        def receive_connect(dbapi_conn: Any, _connection_record: Any) -> None:
            """Handle new database connections."""
            # Set connection parameters for PostgreSQL
            cursor = dbapi_conn.cursor()
            cursor.execute("SET TIME ZONE 'UTC'")
            cursor.close()

        @event.listens_for(pool, "checkout")
        def receive_checkout(_dbapi_conn: Any, _connection_record: Any, _connection_proxy: Any) -> None:
            """Handle connection checkout from pool."""
            # Could add connection validation logic here
            pass

    def initialize(self) -> None:
        """Initialize database engine and session factory."""
        if self._engine is None:
            self._engine = self._create_engine()
            self._session_factory = sessionmaker(
                bind=self._engine,
                autocommit=False,
                autoflush=False,
                expire_on_commit=False,
            )

    def close(self) -> None:
        """Close database engine and clean up resources."""
        if self._engine is not None:
            self._engine.dispose()
            self._engine = None
            self._session_factory = None

    @property
    def engine(self) -> Engine:
        """
        Get SQLAlchemy engine.

        Returns:
            SQLAlchemy engine instance

        Raises:
            RuntimeError: If engine is not initialized
        """
        if self._engine is None:
            raise RuntimeError("RDS client not initialized. Call initialize() first.")
        return self._engine

    @property
    def session_factory(self) -> sessionmaker[Session]:
        """
        Get SQLAlchemy session factory.

        Returns:
            SQLAlchemy session factory

        Raises:
            RuntimeError: If session factory is not initialized
        """
        if self._session_factory is None:
            raise RuntimeError("RDS client not initialized. Call initialize() first.")
        return self._session_factory

    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """
        Context manager for database sessions.

        Yields:
            SQLAlchemy session

        Example:
            with rds_client.get_session() as session:
                result = session.execute(query)
        """
        session = self.session_factory()
        try:
            yield session
            session.commit()
        except exc.SQLAlchemyError:
            session.rollback()
            raise
        finally:
            session.close()

    def create_session(self) -> Session:
        """
        Create a new database session.

        Returns:
            SQLAlchemy session instance

        Note:
            Caller is responsible for closing the session.
            Consider using get_session() context manager instead.
        """
        return self.session_factory()

    def health_check(self) -> bool:
        """
        Perform database health check.

        Returns:
            True if database is accessible, False otherwise
        """
        try:
            with self.get_session() as session:
                session.execute(text("SELECT 1"))
            return True
        except Exception:
            return False
