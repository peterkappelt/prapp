from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .serializers import (
    ExecutionMarkStepSerializer,
    ExecutionSerializer,
    MetaSerializer,
    ProcessSerializer,
)
from .models import Execution, Meta, Process
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from drf_spectacular.types import OpenApiTypes


class ProcessViewSet(viewsets.GenericViewSet):
    serializer_class = ProcessSerializer
    queryset = Process.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=MetaSerializer)
    def list(self, request):
        queryset = Meta.objects.all()
        serializer = MetaSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "revision",
                OpenApiTypes.UUID,
                OpenApiParameter.PATH,
                description="Process ID found in meta.id",
            ),
        ]
    )
    def retrieve(self, request, pk=None):
        meta = get_object_or_404(Meta.objects.all(), pk=pk)
        serializer = ProcessSerializer(meta.latest_revision)
        return Response(serializer.data)

    def create(self, request):
        serializer = ProcessSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "revision",
                OpenApiTypes.UUID,
                OpenApiParameter.PATH,
                description="Process ID found in meta.id",
            )
        ]
    )
    def update(self, request, pk=None):
        meta = get_object_or_404(Meta.objects.all(), pk=pk)

        serializer = ProcessSerializer(
            data=request.data, context={"request": request, "meta": meta}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class ExecutionViewSet(viewsets.GenericViewSet):
    serializer_class = ExecutionSerializer
    queryset = Execution.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, pk=None):
        execution = get_object_or_404(Execution.objects.all(), pk=pk)
        serializer = ExecutionSerializer(execution)
        return Response(serializer.data)

    @extend_schema(
        operation_id="executions_mark_step", responses={200: ExecutionSerializer}
    )
    @action(detail=True, methods=["post"], serializer_class=ExecutionMarkStepSerializer)
    def mark_step(self, request, pk=None):
        req = ExecutionMarkStepSerializer(data=request.data)
        req.is_valid(raise_exception=True)

        execution = get_object_or_404(Execution.objects.all(), pk=pk)
        try:
            step = execution.process.steps.all()[req.data["step_idx"]]
            if step.type != "ST":
                raise Exception()
        except:
            raise serializers.ValidationError(
                {"step_idx": "Must be a valid index of a step with type ST"}
            )

        execution.history.create(type=req.data["mark_as"], step=step, by=request.user)

        serializer = ExecutionSerializer(execution)
        return Response(serializer.data)
