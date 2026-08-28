// ============================================================
// SEEDER — datos iniciales al clonar el proyecto
// ============================================================
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Permisos de administración del sistema (solo para admin)
const ADMIN_RESOURCES = ['users', 'roles'] as const;

// Permisos de dominio (lo que hace un usuario normal)
const DOMAIN_RESOURCES = ['groups', 'members', 'songs', 'setlists', 'events'] as const;

const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

const ACTION_LABEL: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
};

// Permisos específicos que no siguen el patrón CRUD
const SPECIFIC_PERMISSIONS = [
  { name: 'profile.view', group: 'profile', description: 'Ver perfil propio' },
  { name: 'profile.edit', group: 'profile', description: 'Editar perfil propio' },
  { name: 'members.invite', group: 'members', description: 'Invitar miembros a un grupo' },
  { name: 'members.remove', group: 'members', description: 'Expulsar miembros de un grupo' },
  { name: 'members.change_role', group: 'members', description: 'Cambiar rol de miembros' },
];

async function main() {
  console.log('🌱 Sembrando Mi SetList...');

  // ----------------------------------------------------------
  // 1) PERMISOS GLOBALES
  // ----------------------------------------------------------
  
  // Permisos CRUD para admin (users.*, roles.*)
  for (const res of ADMIN_RESOURCES) {
    for (const act of ACTIONS) {
      await prisma.permission.upsert({
        where: { name: `${res}.${act}` },
        update: {},
        create: {
          name: `${res}.${act}`,
          group: res,
          description: `${ACTION_LABEL[act]} ${res}`,
        },
      });
    }
  }

  // Permisos CRUD para dominio (groups.*, songs.*, etc.)
  for (const res of DOMAIN_RESOURCES) {
    for (const act of ACTIONS) {
      await prisma.permission.upsert({
        where: { name: `${res}.${act}` },
        update: {},
        create: {
          name: `${res}.${act}`,
          group: res,
          description: `${ACTION_LABEL[act]} ${res}`,
        },
      });
    }
  }

  // Permisos específicos
  for (const p of SPECIFIC_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: { name: p.name, group: p.group, description: p.description },
    });
  }

  const allPermissions = await prisma.permission.findMany();

  // ----------------------------------------------------------
  // 2) ROLES por defecto
  // ----------------------------------------------------------
  const admin = await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: {},
    create: { name: 'Administrador', description: 'Acceso total al sistema' },
  });
  
  const usuario = await prisma.role.upsert({
    where: { name: 'Usuario' },
    update: {},
    create: {
      name: 'Usuario',
      description: 'Rol por defecto: todo el dominio, sin administración',
    },
  });

  // Administrador: TODOS los permisos
  await prisma.rolePermission.deleteMany({ where: { roleId: admin.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: admin.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // Usuario: todos los permisos EXCEPTO users.* y roles.*
  const userPerms = allPermissions.filter(
    (p) => p.group !== 'users' && p.group !== 'roles'
  );
  await prisma.rolePermission.deleteMany({ where: { roleId: usuario.id } });
  await prisma.rolePermission.createMany({
    data: userPerms.map((p) => ({ roleId: usuario.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // ----------------------------------------------------------
  // 3) USUARIOS iniciales
  // ----------------------------------------------------------
  await prisma.user.upsert({
    where: { email: 'admin@misetlist.app' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@misetlist.app',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: admin.id }] },
    },
  });
  
  await prisma.user.upsert({
    where: { email: 'demo@misetlist.app' },
    update: {},
    create: {
      name: 'Demo',
      email: 'demo@misetlist.app',
      passwordHash: await bcrypt.hash('Demo123!', 10),
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: usuario.id }] },
    },
  });

  // Asegura que TODO usuario sin rol reciba "Usuario"
  const usersWithoutRole = await prisma.user.findMany({
    where: { roles: { none: {} } },
    select: { id: true },
  });
  if (usersWithoutRole.length > 0) {
    await prisma.userRole.createMany({
      data: usersWithoutRole.map((u) => ({ userId: u.id, roleId: usuario.id })),
      skipDuplicates: true,
    });
  }

  // ----------------------------------------------------------
  // 4) GRUPOS DE EJEMPLO
  // ----------------------------------------------------------
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@misetlist.app' },
  });
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@misetlist.app' },
  });

  if (adminUser && demoUser) {
    // Grupo 1: banda del admin; demo es miembro
    const rockBand = await prisma.group.upsert({
      where: { id: '11111111-1111-1111-1111-111111111111' },
      update: {},
      create: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Rock Band Demo',
        description: 'Banda de rock para demostración',
        type: 'band',
        ownerId: adminUser.id,
      },
    });

    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: rockBand.id, userId: adminUser.id } },
      update: {},
      create: { groupId: rockBand.id, userId: adminUser.id, role: 'owner' },
    });
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: rockBand.id, userId: demoUser.id } },
      update: {},
      create: { groupId: rockBand.id, userId: demoUser.id, role: 'member' },
    });

    // Grupo 2: coro del demo
    const choir = await prisma.group.upsert({
      where: { id: '22222222-2222-2222-2222-222222222222' },
      update: {},
      create: {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Coro Municipal',
        description: 'Coro de la ciudad',
        type: 'choir',
        ownerId: demoUser.id,
      },
    });
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: choir.id, userId: demoUser.id } },
      update: {},
      create: { groupId: choir.id, userId: demoUser.id, role: 'owner' },
    });
  }

  console.log('✅ Seed completo:');
  console.log('   admin@misetlist.app / Admin123!  (Administrador - todos los permisos)');
  console.log('   demo@misetlist.app  / Demo123!   (Usuario - todo menos admin)');
  console.log(`   ${allPermissions.length} permisos totales creados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());