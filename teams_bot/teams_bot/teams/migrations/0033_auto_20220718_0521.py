# Generated by Django 3.1.4 on 2022-07-18 12:21

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0032_auto_20220718_0521'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conversationparameters',
            name='time',
            field=models.DateTimeField(default=datetime.datetime(2022, 7, 18, 5, 21, 52, 942326)),
        ),
    ]
