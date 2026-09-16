import bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  const adminPassword = await bcrypt.hash("Admin12345", 12);
  const hrPassword = await bcrypt.hash("HrManager12345", 12);
  const employeePassword = await bcrypt.hash("Employee12345", 12);

  // --------------------------------------------------
  // Admin
  // --------------------------------------------------

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@hrflow.com",
    },

    update: {},

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

    include: {
      employee: true,
    },
  });

  // --------------------------------------------------
  // HR Manager
  // --------------------------------------------------

  const hrManager = await prisma.user.upsert({
    where: {
      email: "hr@hrflow.com",
    },

    update: {},

    create: {
      email: "hr@hrflow.com",
      passwordHash: hrPassword,
      role: "HR_MANAGER",

      employee: {
        create: {
          fullName: "Amaka Eze",
          email: "hr@hrflow.com",
          phone: "+2348022222222",
          position: "HR Manager",
          employmentStatus: "ACTIVE",
          dateJoined: new Date("2025-03-10"),
        },
      },
    },

    include: {
      employee: true,
    },
  });

  // --------------------------------------------------
  // Departments
  // --------------------------------------------------

  const peopleOperations = await prisma.department.upsert({
    where: {
      id: "68f000000000000000000001",
    },

    update: {},

    create: {
      id: "68f000000000000000000001",
      name: "People Operations",
      description:
        "Human resources, employee experience and workplace operations.",
    },
  });

  const engineering = await prisma.department.upsert({
    where: {
      id: "68f000000000000000000002",
    },

    update: {},

    create: {
      id: "68f000000000000000000002",
      name: "Engineering",
      description:
        "Software engineering, infrastructure and technical operations.",
    },
  });

  const recruitment = await prisma.department.upsert({
    where: {
      id: "68f000000000000000000003",
    },

    update: {},

    create: {
      id: "68f000000000000000000003",
      name: "Recruitment",
      description:
        "Talent acquisition and recruitment operations.",
      parentId: peopleOperations.id,
    },
  });

  const frontend = await prisma.department.upsert({
    where: {
      id: "68f000000000000000000004",
    },

    update: {},

    create: {
      id: "68f000000000000000000004",
      name: "Frontend Engineering",
      description:
        "Frontend application development and user interfaces.",
      parentId: engineering.id,
    },
  });

  // --------------------------------------------------
  // Assign department heads
  // --------------------------------------------------

  if (hrManager.employee) {
    await prisma.department.update({
      where: {
        id: peopleOperations.id,
      },

      data: {
        headId: hrManager.employee.id,
      },
    });
  }

  // --------------------------------------------------
  // Additional employees
  // --------------------------------------------------

  const employeeData = [
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
    await prisma.user.upsert({
      where: {
        email: employee.email,
      },

      update: {},

      create: {
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
  }

  console.log("✅ Seed completed successfully!");
  console.log("");
  console.log("Demo accounts:");
  console.log("Admin: admin@hrflow.com / Admin12345");
  console.log("HR: hr@hrflow.com / HrManager12345");
  console.log("Employee: daniel.okoye@hrflow.com / Employee12345");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });