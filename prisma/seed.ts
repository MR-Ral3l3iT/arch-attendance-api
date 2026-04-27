import { PrismaClient, Role, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 เริ่ม Seed ข้อมูล...');

  // ── 1. AcademicYear & Semester ────────────────────────────────────────────
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2567' },
    create: {
      name: '2567',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-05-31'),
      isActive: true,
    },
    update: {},
  });

  const semester1 = await prisma.semester.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: '1' } },
    create: {
      name: '1',
      startDate: new Date('2024-06-17'),
      endDate: new Date('2024-10-20'),
      isActive: true,
      academicYearId: academicYear.id,
    },
    update: {},
  });
  console.log('✅ AcademicYear + Semester');

  // ── 2. Faculty & Department ───────────────────────────────────────────────
  const faculty = await prisma.faculty.upsert({
    where: { code: 'ENG' },
    create: { code: 'ENG', name: 'คณะวิศวกรรมศาสตร์' },
    update: {},
  });

  const department = await prisma.department.upsert({
    where: { code: 'CS' },
    create: { code: 'CS', name: 'วิทยาการคอมพิวเตอร์', facultyId: faculty.id },
    update: {},
  });

  const yearLevel1 = await prisma.yearLevel.upsert({
    where: { level: 1 },
    create: { level: 1, name: 'ชั้นปีที่ 1' },
    update: {},
  });

  const yearLevel2 = await prisma.yearLevel.upsert({
    where: { level: 2 },
    create: { level: 2, name: 'ชั้นปีที่ 2' },
    update: {},
  });

  const yearLevel3 = await prisma.yearLevel.upsert({
    where: { level: 3 },
    create: { level: 3, name: 'ชั้นปีที่ 3' },
    update: {},
  });

  const yearLevel4 = await prisma.yearLevel.upsert({
    where: { level: 4 },
    create: { level: 4, name: 'ชั้นปีที่ 4' },
    update: {},
  });
  console.log('✅ Faculty + Department + YearLevel');

  // ── 3. Building & Room ────────────────────────────────────────────────────
  const building = await prisma.building.upsert({
    where: { code: 'B01' },
    create: {
      code: 'B01',
      name: 'อาคารวิศวกรรม 1',
      latitude: 13.7563,
      longitude: 100.5018,
      radiusMeters: 100,
    },
    update: {},
  });

  const room = await prisma.room.upsert({
    where: { code: 'B01-101' },
    create: { code: 'B01-101', name: 'ห้อง 101', capacity: 40, buildingId: building.id },
    update: {},
  });

  const room2 = await prisma.room.upsert({
    where: { code: 'B01-102' },
    create: { code: 'B01-102', name: 'ห้อง 102', capacity: 40, buildingId: building.id },
    update: {},
  });
  console.log('✅ Building + Rooms');

  // ── 4. Users: Admin ───────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin1234', 12);
  await prisma.user.upsert({
    where: { username: 'admin' },
    create: { username: 'admin', passwordHash: adminHash, role: Role.ADMIN },
    update: {},
  });
  console.log('✅ Admin user (username: admin / password: admin1234)');

  // ── 5. Teacher ────────────────────────────────────────────────────────────
  const teacherHash = await bcrypt.hash('teacher1234', 12);
  const teacherUser = await prisma.user.upsert({
    where: { username: 'teacher001' },
    create: {
      username: 'teacher001',
      passwordHash: teacherHash,
      role: Role.TEACHER,
      teacher: {
        create: {
          code: 'T001',
          firstName: 'สมชาย',
          lastName: 'ใจดี',
          email: 'somchai@university.ac.th',
          facultyId: faculty.id,
          departmentId: department.id,
        },
      },
    },
    update: {},
    include: { teacher: true },
  });
  const teacher = teacherUser.teacher!;

  const teacher2User = await prisma.user.upsert({
    where: { username: 'teacher002' },
    create: {
      username: 'teacher002',
      passwordHash: teacherHash,
      role: Role.TEACHER,
      teacher: {
        create: {
          code: 'T002',
          firstName: 'สุดา',
          lastName: 'รักสอน',
          email: 'suda@university.ac.th',
          facultyId: faculty.id,
          departmentId: department.id,
        },
      },
    },
    update: {},
    include: { teacher: true },
  });
  const teacher2 = teacher2User.teacher!;

  const teacher3User = await prisma.user.upsert({
    where: { username: 'teacher003' },
    create: {
      username: 'teacher003',
      passwordHash: teacherHash,
      role: Role.TEACHER,
      teacher: {
        create: {
          code: 'T003',
          firstName: 'ประพันธ์',
          lastName: 'มีความรู้',
          email: 'prapan@university.ac.th',
          facultyId: faculty.id,
          departmentId: department.id,
        },
      },
    },
    update: {},
    include: { teacher: true },
  });
  const teacher3 = teacher3User.teacher!;
  console.log('✅ Teachers (teacher001 / teacher002 / teacher003 — password: teacher1234)');

  // ── 6. Students (username = email, password = รหัสนักศึกษา) ─────────────────
  const studentDefs = [
    { code: '6701001', firstName: 'สมหญิง', lastName: 'มีสุข',     email: 'somying@student.ac.th',   yearLevelId: yearLevel1.id },
    { code: '6701002', firstName: 'วิชัย',   lastName: 'ขยันเรียน', email: 'wichai@student.ac.th',    yearLevelId: yearLevel1.id },
    { code: '6601001', firstName: 'นภา',     lastName: 'ฉลาดดี',   email: 'napa@student.ac.th',      yearLevelId: yearLevel2.id },
    { code: '6701003', firstName: 'ปิยะ',    lastName: 'ใจงาม',    email: 'piya@student.ac.th',      yearLevelId: yearLevel1.id },
    { code: '6701004', firstName: 'มาลี',    lastName: 'สดใส',     email: 'malee@student.ac.th',     yearLevelId: yearLevel1.id },
    { code: '6701005', firstName: 'ธนา',     lastName: 'วิจิตร',   email: 'thana@student.ac.th',     yearLevelId: yearLevel1.id },
    { code: '6601002', firstName: 'กัญญา',   lastName: 'สุขใจ',    email: 'kanya@student.ac.th',     yearLevelId: yearLevel2.id },
    { code: '6601003', firstName: 'ณัฐพล',   lastName: 'รุ่งเรือง', email: 'nattapon@student.ac.th',  yearLevelId: yearLevel2.id },
    { code: '6501001', firstName: 'ชนิดา',   lastName: 'เก่งดี',   email: 'chanida@student.ac.th',   yearLevelId: yearLevel3.id },
    { code: '6501002', firstName: 'วรรณี',   lastName: 'สวยงาม',   email: 'wannee@student.ac.th',    yearLevelId: yearLevel3.id },
  ];

  const allStudents = await Promise.all(
    studentDefs.map(async (s) => {
      const hash = await bcrypt.hash(s.code, 12);
      return (await prisma.user.upsert({
        where: { username: s.email },
        create: {
          username: s.email,
          passwordHash: hash,
          role: Role.STUDENT,
          student: {
            create: { code: s.code, firstName: s.firstName, lastName: s.lastName,
              email: s.email, facultyId: faculty.id, departmentId: department.id, yearLevelId: s.yearLevelId },
          },
        },
        update: {},
        include: { student: true },
      })).student!;
    }),
  );

  const [student1, student2, student3, s4, s5, s6, s7, s8, s9, s10] = allStudents;
  console.log('✅ Students 10 คน (username = email, password = รหัสนักศึกษา)');

  // ── 7. Course & Section ───────────────────────────────────────────────────
  const course = await prisma.course.upsert({
    where: { code: 'CS101' },
    create: {
      code: 'CS101',
      name: 'การเขียนโปรแกรมคอมพิวเตอร์',
      credits: 3,
      facultyId: faculty.id,
      departmentId: department.id,
    },
    update: {},
  });

  const course2 = await prisma.course.upsert({
    where: { code: 'CS102' },
    create: { code: 'CS102', name: 'โครงสร้างข้อมูล', credits: 3, facultyId: faculty.id, departmentId: department.id },
    update: {},
  });

  const course3 = await prisma.course.upsert({
    where: { code: 'CS201' },
    create: { code: 'CS201', name: 'ระบบฐานข้อมูล', credits: 3, facultyId: faculty.id, departmentId: department.id },
    update: {},
  });

  const section = await prisma.section.upsert({
    where: { courseId_semesterId_name: { courseId: course.id, semesterId: semester1.id, name: 'กลุ่ม 1' } },
    create: { name: 'กลุ่ม 1', courseId: course.id, semesterId: semester1.id },
    update: {},
  });

  const section2 = await prisma.section.upsert({
    where: { courseId_semesterId_name: { courseId: course2.id, semesterId: semester1.id, name: 'กลุ่ม 1' } },
    create: { name: 'กลุ่ม 1', courseId: course2.id, semesterId: semester1.id },
    update: {},
  });

  const section3 = await prisma.section.upsert({
    where: { courseId_semesterId_name: { courseId: course3.id, semesterId: semester1.id, name: 'กลุ่ม 1' } },
    create: { name: 'กลุ่ม 1', courseId: course3.id, semesterId: semester1.id },
    update: {},
  });
  console.log('✅ Courses (CS101, CS102, CS201) + Sections');

  // ── 8. Schedule ───────────────────────────────────────────────────────────
  const existingSchedule = await prisma.schedule.findFirst({
    where: {
      sectionId: section.id,
      dayOfWeek: DayOfWeek.MONDAY,
      semesterId: semester1.id,
    },
  });

  const schedule = existingSchedule ?? await prisma.schedule.create({
    data: {
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '08:00',
      endTime: '11:00',
      sectionId: section.id,
      roomId: room.id,
      teacherId: teacher.id,
      semesterId: semester1.id,
    },
  });

  // CS102 — อังคาร 09:00-12:00 (teacher002)
  const existingSchedule2 = await prisma.schedule.findFirst({
    where: { sectionId: section2.id, dayOfWeek: DayOfWeek.TUESDAY, semesterId: semester1.id },
  });
  const schedule2 = existingSchedule2 ?? await prisma.schedule.create({
    data: {
      dayOfWeek: DayOfWeek.TUESDAY,
      startTime: '09:00',
      endTime: '12:00',
      sectionId: section2.id,
      roomId: room.id,
      teacherId: teacher2.id,
      semesterId: semester1.id,
    },
  });

  // CS201 — พุธ 13:00-16:00 (teacher003)
  const existingSchedule3 = await prisma.schedule.findFirst({
    where: { sectionId: section3.id, dayOfWeek: DayOfWeek.WEDNESDAY, semesterId: semester1.id },
  });
  const schedule3 = existingSchedule3 ?? await prisma.schedule.create({
    data: {
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startTime: '13:00',
      endTime: '16:00',
      sectionId: section3.id,
      roomId: room2.id,
      teacherId: teacher3.id,
      semesterId: semester1.id,
    },
  });

  // CS101 section 2 — พฤหัสบดี 13:00-16:00 (teacher001) สำหรับนักศึกษาปี 2
  const section1b = await prisma.section.upsert({
    where: { courseId_semesterId_name: { courseId: course.id, semesterId: semester1.id, name: 'กลุ่ม 2' } },
    create: { name: 'กลุ่ม 2', courseId: course.id, semesterId: semester1.id },
    update: {},
  });
  const existingSchedule4 = await prisma.schedule.findFirst({
    where: { sectionId: section1b.id, dayOfWeek: DayOfWeek.THURSDAY, semesterId: semester1.id },
  });
  const schedule4 = existingSchedule4 ?? await prisma.schedule.create({
    data: {
      dayOfWeek: DayOfWeek.THURSDAY,
      startTime: '13:00',
      endTime: '16:00',
      sectionId: section1b.id,
      roomId: room2.id,
      teacherId: teacher.id,
      semesterId: semester1.id,
    },
  });
  void schedule4;

  console.log('✅ Schedules (จ.08:00 / อ.09:00 / พ.13:00 / พฤ.13:00)');

  // ── 9. Attendance Settings (override) ────────────────────────────────────
  for (const schId of [schedule.id, schedule2.id, schedule3.id]) {
    await prisma.attendanceSettings.upsert({
      where: { scheduleId: schId },
      create: { scheduleId: schId, openBeforeMinutes: 15, closeAfterMinutes: 30, lateAfterMinutes: 15, absentAfterMinutes: 30 },
      update: {},
    });
  }
  console.log('✅ AttendanceSettings');

  // ── 10. Enrollments ───────────────────────────────────────────────────────
  // ปี 1 (5 คน) → CS101 (จ.) + CS102 (อ.)
  const year1Students = [student1.id, student2.id, s4.id, s5.id, s6.id];
  // ปี 2 (3 คน) → CS102 (อ.) + CS201 (พ.)
  const year2Students = [student3.id, s7.id, s8.id];
  // ปี 3 (2 คน) → CS201 (พ.) + CS101 กลุ่ม 2 (พฤ.)
  const year3Students = [s9.id, s10.id];

  const enrollmentPairs: { studentId: string; sectionId: string }[] = [
    ...year1Students.flatMap((sid) => [
      { studentId: sid, sectionId: section.id  }, // CS101 กลุ่ม 1
      { studentId: sid, sectionId: section2.id }, // CS102 กลุ่ม 1
    ]),
    ...year2Students.flatMap((sid) => [
      { studentId: sid, sectionId: section2.id }, // CS102 กลุ่ม 1
      { studentId: sid, sectionId: section3.id }, // CS201 กลุ่ม 1
    ]),
    ...year3Students.flatMap((sid) => [
      { studentId: sid, sectionId: section3.id  }, // CS201 กลุ่ม 1
      { studentId: sid, sectionId: section1b.id }, // CS101 กลุ่ม 2
    ]),
  ];

  for (const pair of enrollmentPairs) {
    await prisma.enrollment.upsert({
      where: { studentId_sectionId: pair },
      create: pair,
      update: {},
    });
  }
  console.log(`✅ Enrollments (${enrollmentPairs.length} รายการ — 10 นักศึกษา × 2 วิชา)`);

  // ── 11. System Settings (default) ─────────────────────────────────────────
  const defaultSettings = [
    { key: 'CHECK_IN_OPEN_BEFORE_MINUTES', value: '15', description: 'เปิดรับเช็คชื่อก่อนคาบกี่นาที' },
    { key: 'CHECK_IN_LATE_AFTER_MINUTES', value: '15', description: 'นับว่ามาสายหลังคาบเริ่มกี่นาที' },
    { key: 'CHECK_IN_ABSENT_AFTER_MINUTES', value: '30', description: 'นับว่าขาดเรียนหลังคาบเริ่มกี่นาที' },
    { key: 'GPS_RADIUS_METERS', value: '100', description: 'รัศมีขอบเขต GPS ค่าเริ่มต้น (เมตร)' },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      create: setting,
      update: { value: setting.value },
    });
  }
  console.log('✅ System Settings');

  console.log('\n🎉 Seed เสร็จสมบูรณ์!');
  console.log('\n📋 ข้อมูล Login:');
  console.log('  👤 Admin    → admin        / admin1234');
  console.log('  👨‍🏫 Teacher  → teacher001   / teacher1234  (CS101 จ. | สมชาย ใจดี)');
  console.log('  👨‍🏫 Teacher  → teacher002   / teacher1234  (CS102 อ. | สุดา รักสอน)');
  console.log('  👨‍🏫 Teacher  → teacher003   / teacher1234  (CS201 พ. | ประพันธ์ มีความรู้)');
  console.log('');
  console.log('  👩‍🎓 ปี 1 → somying/wichai/piya/malee/thana @student.ac.th  (password = รหัส นศ.)');
  console.log('  👩‍🎓 ปี 2 → napa/kanya/nattapon @student.ac.th             (password = รหัส นศ.)');
  console.log('  👩‍🎓 ปี 3 → chanida/wannee @student.ac.th                  (password = รหัส นศ.)');
  console.log('');
  console.log('  📅 ตารางเรียน:');
  console.log('     CS101 กลุ่ม 1 — จันทร์    08:00-11:00  ห้อง B01-101');
  console.log('     CS102 กลุ่ม 1 — อังคาร    09:00-12:00  ห้อง B01-101');
  console.log('     CS201 กลุ่ม 1 — พุธ       13:00-16:00  ห้อง B01-102');
  console.log('     CS101 กลุ่ม 2 — พฤหัสบดี  13:00-16:00  ห้อง B01-102');
}

main()
  .catch((e) => {
    console.error('❌ Seed ล้มเหลว:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
