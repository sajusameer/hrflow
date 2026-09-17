import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // --------------------------------------------------
  // Passwords
  // --------------------------------------------------
  const adminPassword = await bcrypt.hash("admin123", 12);
  const hrPassword = await bcrypt.hash("password123", 12);
  const employeePassword = await bcrypt.hash("saju1234", 12);

  // --------------------------------------------------
  // Admin
  // --------------------------------------------------
  await prisma.user.upsert({
    where: { email: "admin@hrflow.com" },
    update: { passwordHash: adminPassword },
    create: {
      email: "admin@hrflow.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      employee: {
        create: {
          fullName: "Chinedu Okafor",
          email: "admin@hrflow.com",
          phone: "+2348011111111",
          position: "HRFlow Administrator",
          employmentStatus: "ACTIVE",
          dateJoined: new Date("2025-01-15"),
        },
      },
    },
    include: { employee: true },
  });

  // --------------------------------------------------
  // HR Manager
  // --------------------------------------------------
  let hrManager = await prisma.user.findUnique({
    where: { email: "sanan@gmail.com" },
    include: { employee: true },
  });

  if (!hrManager) {
    hrManager = await prisma.user.create({
      data: {
        email: "sanan@gmail.com",
        passwordHash: hrPassword,
        role: "HR_MANAGER",
        employee: {
          create: {
            fullName: "Sanan",
            email: "sanan@gmail.com",
            phone: "+8801700000000",
            position: "HR Manager",
            employmentStatus: "ACTIVE",
            dateJoined: new Date("2025-03-10"),
          },
        },
      },
      include: { employee: true },
    });
  } else {
    await prisma.user.update({
      where: { id: hrManager.id },
      data: { passwordHash: hrPassword },
    });

    if (!hrManager.employee) {
      const createdEmp = await prisma.employee.create({
        data: {
          userId: hrManager.id,
          fullName: "Sanan",
          email: "sanan@gmail.com",
          phone: "+8801700000000",
          position: "HR Manager",
          employmentStatus: "ACTIVE",
          dateJoined: new Date("2025-03-10"),
        },
      });
      hrManager.employee = createdEmp;
    }
  }

  // --------------------------------------------------
  // Departments (Hierarchical Tree)
  // --------------------------------------------------
  const peopleOperations = await prisma.department.upsert({
    where: { id: "68f000000000000000000001" },
    update: {},
    create: {
      id: "68f000000000000000000001",
      name: "People Operations",
      description: "Human resources, employee experience and workplace operations.",
    },
  });

  const engineering = await prisma.department.upsert({
    where: { id: "68f000000000000000000002" },
    update: {},
    create: {
      id: "68f000000000000000000002",
      name: "Engineering",
      description: "Software engineering, infrastructure and technical operations.",
    },
  });

  const recruitment = await prisma.department.upsert({
    where: { id: "68f000000000000000000003" },
    update: { parentId: peopleOperations.id },
    create: {
      id: "68f000000000000000000003",
      name: "Recruitment",
      description: "Talent acquisition and recruitment operations.",
      parentId: peopleOperations.id,
    },
  });

  const frontend = await prisma.department.upsert({
    where: { id: "68f000000000000000000004" },
    update: { parentId: engineering.id },
    create: {
      id: "68f000000000000000000004",
      name: "Frontend Engineering",
      description: "Frontend application development and user interfaces.",
      parentId: engineering.id,
    },
  });

  // --------------------------------------------------
  // Assign Department Head
  // --------------------------------------------------
  if (hrManager?.employee?.id) {
    await prisma.department.update({
      where: { id: peopleOperations.id },
      data: { headId: hrManager.employee.id },
    });
  }

  // --------------------------------------------------
  // Additional Employees (Including Sajeda Begum)
  // --------------------------------------------------
  const employeeData = [
    {
      email: "sajeda@gmail.com",
      fullName: "Sajeda Begum",
      phone: "+8801700000001",
      position: "Frontend Developer",
      departmentId: frontend.id,
    },
    {
      email: "daniel.okoye@hrflow.com",
      fullName: "Daniel Okoye",
      phone: "+2348033333333",
      position: "Frontend Developer",
      departmentId: frontend.id,
    },
    {
      email: "fatima.bello@hrflow.com",
      fullName: "Fatima Bello",
      phone: "+2348044444444",
      position: "Recruitment Specialist",
      departmentId: recruitment.id,
    },
    {
      email: "tunde.adeyemi@hrflow.com",
      fullName: "Tunde Adeyemi",
      phone: "+2348055555555",
      position: "Backend Developer",
      departmentId: engineering.id,
    },
  ];

  for (const employee of employeeData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: employee.email },
      include: { employee: true },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: employee.email,
          passwordHash: employeePassword,
          role: "EMPLOYEE",
          employee: {
            create: {
              fullName: employee.fullName,
              email: employee.email,
              phone: employee.phone,
              position: employee.position,
              employmentStatus: "ACTIVE",
              dateJoined: new Date("2026-01-10"),
              departmentId: employee.departmentId,
            },
          },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash: employeePassword },
      });

      if (!existingUser.employee) {
        await prisma.employee.create({
          data: {
            userId: existingUser.id,
            fullName: employee.fullName,
            email: employee.email,
            phone: employee.phone,
            position: employee.position,
            employmentStatus: "ACTIVE",
            dateJoined: new Date("2026-01-10"),
            departmentId: employee.departmentId,
          },
        });
      }
    }
  }

  console.log("✅ Seed completed successfully!");
  console.log("");
  console.log("Demo Accounts (Ready for Evaluation):");
  console.log("Admin: admin@hrflow.com / admin123");
  console.log("HR: sanan@gmail.com / password123");
  console.log("Employee: sajeda@gmail.com / saju1234");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });