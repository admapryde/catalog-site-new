import { createClient } from '@/lib/supabase-server';
import { hashPassword } from '@/utils/password-utils';

async function seedAdminUsers() {
  console.log('Seeding admin users...');
  
  try {
    const supabase = await createClient();
    
    // Hash the default admin password
    const passwordHash = await hashPassword('admin123');
    
    // Insert the default admin user
    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          username: 'admin',
          email: 'admin@example.com',
          password_hash: passwordHash,
          role: 'admin'
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation - user already exists
        console.log('Admin user already exists');
      } else {
        console.error('Error inserting admin user:', error);
        throw error;
      }
    } else {
      console.log('Admin user created successfully:', data);
    }
  } catch (error) {
    console.error('Error seeding admin users:', error);
    throw error;
  }
}

// Run the seeding function
if (require.main === module) {
  seedAdminUsers()
    .then(() => {
      console.log('Admin users seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Admin users seeding failed:', error);
      process.exit(1);
    });
}

export { seedAdminUsers };