from datetime import datetime
from typing import Optional
import uuid
from django.db import models
from django.conf import settings
from dataclasses import dataclass
from django.contrib.auth.models import User
from django.db.models.query import QuerySet


class Meta(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    createdBy = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    createdAt = models.DateTimeField(auto_now_add=True)

    @property
    def latest_revision(self):
        return self.revisions.order_by("-createdAt").first()


class Process(models.Model):
    revision = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    createdAt = models.DateTimeField(auto_now_add=True)

    meta = models.ForeignKey(Meta, on_delete=models.CASCADE, related_name="revisions")

    def __str__(self):
        return self.title


class Step(models.Model):
    class Type(models.TextChoices):
        Section = "SE", "Section"
        Step = "ST", "Step"

    @dataclass
    class ExecutionInfo:
        startedAt: Optional[datetime] = None
        startedBy: Optional[User] = None
        doneAt: Optional[datetime] = None
        doneBy: Optional[User] = None

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=2, choices=Type.choices)
    description = models.TextField(blank=True)

    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="steps")

    def history(self, execution: "Execution") -> QuerySet["HistoryItem"]:
        return self.historyitem_set.filter(execution=execution).order_by("-at")

    def execution_info(self, execution: "Execution"):
        history = self.history(execution)
        info = Step.ExecutionInfo()

        if (started := history.filter(type="StepStarted").first()) is not None:
            info.startedAt = started.at
            info.startedBy = started.by

        if (done := history.filter(type="StepDone").first()) is not None:
            info.doneAt = done.at
            info.doneBy = done.by

        return info


class Execution(models.Model):
    class ExecutionState(models.TextChoices):
        Started = "started"
        Done = "done"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    initiatedBy = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    initiatedAt = models.DateTimeField(auto_now_add=True)
    process = models.ForeignKey(
        Process, on_delete=models.CASCADE, related_name="executions"
    )

    @property
    def state(self):
        steps = self.process.steps.filter(type="ST")
        info = [s.execution_info(self) for s in steps]

        if all([(i.startedAt is not None) and (i.doneAt is not None) for i in info]):
            return "done"
        return "started"


class HistoryItem(models.Model):
    class Type(models.TextChoices):
        StepDone = "StepDone"
        StepStarted = "StepStarted"

    execution = models.ForeignKey(
        Execution, on_delete=models.CASCADE, related_name="history"
    )

    type = models.CharField(max_length=16, choices=Type.choices)
    step = models.ForeignKey(Step, on_delete=models.CASCADE)
    at = models.DateTimeField(auto_now_add=True)
    by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
