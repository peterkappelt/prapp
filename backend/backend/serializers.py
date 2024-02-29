from rest_framework import serializers
from .models import Meta, Process, Step


class MetaSerializer(serializers.ModelSerializer):
    createdBy = serializers.PrimaryKeyRelatedField(
        default=serializers.CurrentUserDefault(), read_only=True
    )

    class Meta:
        model = Meta
        fields = ("id", "createdAt", "createdBy")


class StepSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="step_id", read_only=True)

    class Meta:
        model = Step
        fields = ("id", "title", "type", "description")


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
