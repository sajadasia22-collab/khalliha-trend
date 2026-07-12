import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth/password";
import { UserRole, UserStatus } from "../src/generated/prisma/client";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SUPER_ADMIN_FULL_NAME || "مدير النظام";

  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL و SUPER_ADMIN_PASSWORD مطلوبان في متغيرات البيئة لإنشاء Super Admin.",
    );
  }

  const passwordHash = hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email,
      fullName,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`Super Admin جاهز: ${user.email} (${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
