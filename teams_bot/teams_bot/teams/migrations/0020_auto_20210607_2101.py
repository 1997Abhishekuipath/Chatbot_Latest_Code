# Generated by Django 3.1.4 on 2021-06-07 15:31

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0019_auto_20210305_1310'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conversationparameters',
            name='time',
            field=models.DateTimeField(default=datetime.datetime(2021, 6, 7, 21, 1, 6, 511927)),
        ),
    ]