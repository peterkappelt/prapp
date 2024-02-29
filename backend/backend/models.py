import uuid
from django.db import models
from django.conf import settings


class Meta(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    createdBy = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    createdAt = models.DateTimeField(auto_now_add=True)


class Process(models.Model):
    revision = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    createdAt = models.DateTimeField(auto_now_add=True)

    meta = models.ForeignKey(Meta, on_delete=models.CASCADE, related_name="revisions")

    def __str__(self):
        return self.title


class Step(models.Model):
    class Type(models.TextChoices):
        Section = (
            "SE",
            "Section",
        )
        Step = "ST", "Step"

    step_id = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=2, choices=Type.choices)
    description = models.TextField(blank=True)

    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="steps")
