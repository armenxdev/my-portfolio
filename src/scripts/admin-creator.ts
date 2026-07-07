import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { registerSchema } from '../schemas/auth.schema'; 
import 'dotenv/config';

async function createInitialAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error("❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD are required in your .env file.");
        process.exit(1);
    }

    console.log('🔍 Validating credentials using Register Schema...');

    const { error, value } = registerSchema.validate({
        email: email,
        password: password,
    }, { abortEarly: false });

    if (error) {
        console.error('❌ Validation Error: Admin configuration does not meet requirements!');
        error.details.forEach((detail) => {
            console.error(`   - [${detail.path.join('.')}]: ${detail.message}`);
        });
        process.exit(1);
    }

    const validatedEmail = value.email;
    const validatedPassword = value.password;

    try {
        console.log('Connecting to database via Prisma...');

        const existingAdmin = await prisma.admin.findUnique({
            where: { email: validatedEmail }
        });

        if (existingAdmin) {
            console.warn(`⚠️ Admin with email "${validatedEmail}" already exists!`);
            process.exit(0);
        }

        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(validatedPassword, 12);

        console.log("💾 Saving admin to database...");

        await prisma.admin.create({
            data: {
                email: validatedEmail,
                password_hash: hashedPassword
            }
        });

        console.log('🎉 SUCCESS: Super Admin created successfully!');
        console.log(`📧 Email: ${validatedEmail}`);
        console.log(`🔑 Password: ${validatedPassword}`);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

createInitialAdmin();