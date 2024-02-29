from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .serializers import MetaSerializer, ProcessSerializer
from .models import Meta, Process
from drf_spectacular.utils import extend_schema, OpenApiParameter
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
        process = meta.revisions.order_by("-createdAt").first()
        serializer = ProcessSerializer(process)
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
