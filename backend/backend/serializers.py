from typing import Literal, Optional
from rest_framework import serializers
from .models import Execution, Meta, Process, Step
from datetime import datetime


class EmptySerializer(serializers.Serializer):
    pass


class MetaSerializer(serializers.ModelSerializer):
    createdBy = serializers.PrimaryKeyRelatedField(
        default=serializers.CurrentUserDefault(), read_only=True
    )

    class Meta:
        model = Meta
        fields = ("id", "createdAt", "createdBy")


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ("title", "type", "description")


class ProcessSerializer(serializers.ModelSerializer):
    steps = StepSerializer(many=True)
    meta = MetaSerializer(required=False, read_only=True)

    class Meta:
        model = Process
        fields = ("revision", "title", "createdAt", "meta", "steps")
        depth = 1

    def create(self, validated_data):
        steps = validated_data.pop("steps")

        if not "meta" in self.context:
            meta = Meta.objects.create(createdBy=self.context["request"].user)
        else:
            meta = self.context["meta"]

        process = Process.objects.create(meta=meta, **validated_data)
        for step in steps:
            Step.objects.create(process=process, **step)
        return process


class StepExecutionSerializer(serializers.ModelSerializer):
    startedAt = serializers.SerializerMethodField()
    startedBy = serializers.SerializerMethodField()
    doneAt = serializers.SerializerMethodField()
    doneBy = serializers.SerializerMethodField()

    class Meta:
        model = Step
        fields = (
            "title",
            "type",
            "description",
            "startedAt",
            "startedBy",
            "doneAt",
            "doneBy",
        )

    def get_startedAt(self, obj: Step) -> Optional[datetime]:
        self.info = obj.execution_info(self.context["execution"])
        return self.info.startedAt

    def get_startedBy(self, obj) -> Optional[int]:
        return self.info.startedBy.pk if self.info.startedBy else None

    def get_doneAt(self, obj) -> Optional[datetime]:
        return self.info.doneAt

    def get_doneBy(self, obj) -> Optional[int]:
        return self.info.doneBy.pk if self.info.doneBy else None


class ProcessExecutionSerializer(ProcessSerializer):
    steps = StepExecutionSerializer(many=True)


class ExecutionSerializer(serializers.ModelSerializer):
    process = ProcessExecutionSerializer()
    state = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance:
            self.context["execution"] = self.instance

    class Meta:
        model = Execution
        fields = ("id", "initiatedAt", "initiatedBy", "state", "process")

    def get_state(self, obj: Execution) -> Literal["done", "started"]:
        return obj.state


class ExecutionShallowSerializer(serializers.ModelSerializer):
    state = serializers.SerializerMethodField()

    class Meta:
        model = Execution
        fields = ("id", "initiatedAt", "initiatedBy", "state")

    def get_state(self, obj: Execution) -> Literal["done", "started"]:
        return obj.state


class ExecutionMarkStepSerializer(serializers.Serializer):
    mark_as = serializers.ChoiceField(["StepStarted", "StepDone"])
    step_idx = serializers.IntegerField()
