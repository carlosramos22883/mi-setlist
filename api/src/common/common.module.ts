// ============================================================
// COMMON MODULE — módulo global de utilidades compartidas
// ============================================================
// @Global() hace que PermissionsGuard esté disponible en TODOS
// los módulos sin necesidad de importarlo explícitamente.
import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  providers: [PermissionsGuard],
  exports: [PermissionsGuard],
})
export class CommonModule {}
