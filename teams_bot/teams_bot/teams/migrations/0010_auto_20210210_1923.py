# Generated by Django 3.1.4 on 2021-02-10 13:53

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0009_conversationparameters_time'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conversationparameters',
            name='time',
            field=models.DateTimeField(default=datetime.datetime(2021, 2, 10, 13, 53, 23, 373967, tzinfo=utc)),
        ),
    ]