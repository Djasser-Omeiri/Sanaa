from django.db import migrations

TRADE_NAMES = ["Carpenter", "Electrician", "Mason", "Painter", "Plumber"]


def create_trades(apps, schema_editor):
    Trade = apps.get_model("workers", "Trade")
    for name in TRADE_NAMES:
        Trade.objects.get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [("workers", "0001_initial")]

    operations = [migrations.RunPython(create_trades, migrations.RunPython.noop)]
