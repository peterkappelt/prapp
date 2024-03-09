from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .serializers import (
    EmptySerializer,
    ExecutionMarkStepSerializer,
    ExecutionSerializer,
    ExecutionShallowSerializer,
    ProcessSerializer,
)
from .models import Execution, Meta, Process
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from drf_spectacular.types import OpenApiTypes


class ProcessViewSet(viewsets.GenericViewSet):
    serializer_class = ProcessSerializer
    queryset = Process.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        queryset = Meta.objects.all()
        processes = map(lambda x: x.latest_revision, queryset)
        serializer = ProcessSerializer(processes, many=True)
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

    @extend_schema(
        operation_id="processes_start_execution", responses={200: ExecutionSerializer}
    )
    @action(detail=True, methods=["POST"], serializer_class=EmptySerializer)
    def start_execution(self, request, pk=None):
        process = get_object_or_404(Meta.objects.all(), pk=pk).latest_revision

        exec = process.executions.create(initiatedBy=request.user)

        steps = exec.process.steps.all()
        first_step = next((s for s in steps if s.type == "ST"), None)
        if (first_step is not None) and (first_step.startWithPrevious):
            exec.history.create(type="StepStarted", step=first_step, by=request.user)

        serializer = ExecutionSerializer(exec)
        return Response(serializer.data)

    @extend_schema(responses={200: ExecutionShallowSerializer(many=True)})
    @action(detail=True, methods=["GET"], serializer_class=EmptySerializer)
    def executions(self, request, pk=None):
        meta = get_object_or_404(Meta.objects.all(), pk=pk)
        execs = Execution.objects.filter(process__meta=meta.id).order_by("-initiatedAt")

        serializer = ExecutionShallowSerializer(execs, many=True)
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

        step_idx, mark_as = req.data["step_idx"], req.data["mark_as"]
        execution = get_object_or_404(Execution.objects.all(), pk=pk)
        steps = execution.process.steps.all()

        try:
            step = steps[step_idx]
            if step.type != "ST":
                raise Exception()
        except:
            raise serializers.ValidationError(
                {"step_idx": "Must be a valid index of a step with type ST"}
            )

        # create the history item where the step gets marked as "started" or "done"
        execution.history.create(type=mark_as, step=step, by=request.user)

        # get the following step
        following_steps = steps[(step_idx + 1) :]
        next_step = next((s for s in following_steps if s.type == "ST"), None)

        # the next step might have "startWithPrevious" set
        # if that's the case and the current step is marked as done
        # we shall mark the following step as started
        if (
            (mark_as == "StepDone")
            and (next_step is not None)
            and (next_step.startWithPrevious)
        ):
            execution.history.create(
                type="StepStarted", step=next_step, by=request.user
            )

        serializer = ExecutionSerializer(execution)
        return Response(serializer.data)
