from pathlib import Path
import asyncpg


async def ensure_database_seeded(conn: asyncpg.Connection) -> None:
    """Ensure schema and seed exist in PostgreSQL."""
    table_exists = await conn.fetchval(
        """
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'roles'
        )
        """
    )
    root_dir = Path(__file__).resolve().parents[3]
    db_dir = root_dir / "database"
    if not db_dir.exists():
        db_dir = Path("/app/database")

    if not table_exists:
        schema_sql = (db_dir / "schema.sql").read_text(encoding="utf-8")
        await conn.execute(schema_sql)

    role_count = await conn.fetchval("SELECT COUNT(*) FROM roles")
    if not role_count or int(role_count) == 0:
        seed_sql = (db_dir / "seed.sql").read_text(encoding="utf-8")
        await conn.execute(seed_sql)


async def reset_demo_state(conn: asyncpg.Connection) -> None:
    """Reset mutable state to baseline for repeatable automated testing."""
    root_dir = Path(__file__).resolve().parents[3]
    db_dir = root_dir / "database"
    if not db_dir.exists():
        db_dir = Path("/app/database")
    schema_sql = (db_dir / "schema.sql").read_text(encoding="utf-8")
    seed_sql = (db_dir / "seed.sql").read_text(encoding="utf-8")
    await conn.execute(schema_sql)
    await conn.execute(seed_sql)
