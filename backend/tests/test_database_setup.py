from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory

from app import MIGRATIONS_DIR
from app.config import _engine_options
from app.extensions import db


def test_new_schema_is_stamped_at_migration_head(app):
    heads = ScriptDirectory(str(MIGRATIONS_DIR)).get_heads()
    with app.app_context(), db.engine.connect() as conn:
        current = MigrationContext.configure(conn).get_current_heads()
    assert set(current) == set(heads)


def test_transaction_pooler_disables_prepared_statements():
    url = "postgresql+psycopg://postgres.ref:pw@aws-0-region.pooler.supabase.com:6543/postgres"
    assert _engine_options(url)["connect_args"] == {"prepare_threshold": None}


def test_session_pooler_keeps_prepared_statements():
    url = "postgresql+psycopg://postgres.ref:pw@aws-0-region.pooler.supabase.com:5432/postgres"
    assert "connect_args" not in _engine_options(url)
