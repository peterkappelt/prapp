from django.contrib import admin

from .models import Execution, HistoryItem, Meta, Process, Step

admin.site.register(Step)


class StepInline(admin.TabularInline):
    model = Step
    extra = 1


class ProcessInline(admin.TabularInline):
    model = Process
    readonly_fields = ("createdAt",)
    ordering = ("-createdAt",)
    extra = 1


class HistoryItemInline(admin.TabularInline):
    model = HistoryItem
    readonly_fields = ("at",)
    ordering = ("-at",)
    extra = 1


@admin.register(Process)
class ProcessAdmin(admin.ModelAdmin):
    inlines = [StepInline]


@admin.register(Meta)
class MetaAdmin(admin.ModelAdmin):
    inlines = [ProcessInline]
    readonly_fields = ("id",)


@admin.register(Execution)
class ExecutionAdmin(admin.ModelAdmin):
    inlines = [HistoryItemInline]
