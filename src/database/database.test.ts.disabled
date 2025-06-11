import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import {
  initDatabase,
  addUser,
  findUserByEmail,
  findUserByPhone,
  addFamily,
  findFamilyByName,
  User,
  Family,
} from './index'; // Adjust path as necessary

describe('Database Functions', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    // Use an in-memory database for each test
    // NOTE: This assumes openDatabaseSync with null or ':memory:' works as expected for tests.
    // If direct in-memory is not supported directly by the version/setup of expo-sqlite,
    // this would need to be actual file DB that is cleared, or deeper mocking.
    db = openDatabaseSync(':memory:'); // Or openDatabaseSync(null as any) depending on exact API
    await initDatabase(db); // Initialize schema for each test
  });

  afterEach(async () => {
    // Close the database connection if the API supports it, or clear tables.
    // For in-memory, it's often enough that it's recreated in beforeEach.
    // await db.closeAsync(); // if available
  });

  describe('Families Table', () => {
    it('should add a new family and return its ID', async () => {
      const familyName = 'Smith';
      const familyId = await addFamily(db, familyName);
      expect(familyId).toBeGreaterThan(0);

      const foundFamily = await findFamilyByName(db, familyName);
      expect(foundFamily).not.toBeNull();
      expect(foundFamily!.name).toBe(familyName);
      expect(foundFamily!.id).toBe(familyId);
    });

    it('should return an existing family if name is unique', async () => {
      const familyName = 'Jones';
      await addFamily(db, familyName);
      // Attempting to add the same family name again
      // SQLite UNIQUE constraint should prevent this.
      // The current addFamily doesn't explicitly handle this, it would throw an error.
      try {
        await addFamily(db, familyName);
        // Should not reach here if UNIQUE constraint works
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
        // Check for a message typical of a UNIQUE constraint violation
        // e.g., error.message.includes('UNIQUE constraint failed: families.name')
        // This depends on the exact error object thrown by expo-sqlite
         expect(error.message).toMatch(/UNIQUE constraint failed/i);
      }
    });

    it('findFamilyByName should return null for a non-existing family', async () => {
      const foundFamily = await findFamilyByName(db, 'NonExistentFamily');
      expect(foundFamily).toBeNull();
    });
  });

  describe('Users Table', () => {
    let testFamilyId: number;

    beforeEach(async () => {
      // Add a family for user tests
      testFamilyId = await addFamily(db, 'Test Family');
    });

    it('should add a new user without a family and return its ID', async () => {
      const user = { name: 'John Doe', email: 'john.doe@example.com', phone: '1234567890', passwordHash: 'hash123' };
      const userId = await addUser(db, user.name, user.phone, user.email, user.passwordHash, null);
      expect(userId).toBeGreaterThan(0);

      const foundUser = await findUserByEmail(db, user.email);
      expect(foundUser).not.toBeNull();
      expect(foundUser!.name).toBe(user.name);
      expect(foundUser!.email).toBe(user.email);
      expect(foundUser!.family_id).toBeNull();
    });

    it('should add a new user with a family_id and return its ID', async () => {
      const user = { name: 'Jane Doe', email: 'jane.doe@example.com', phone: '0987654321', passwordHash: 'hash456' };
      const userId = await addUser(db, user.name, user.phone, user.email, user.passwordHash, testFamilyId);
      expect(userId).toBeGreaterThan(0);

      const foundUser = await findUserByEmail(db, user.email);
      expect(foundUser).not.toBeNull();
      expect(foundUser!.name).toBe(user.name);
      expect(foundUser!.family_id).toBe(testFamilyId);
    });

    it('should fail to add user with duplicate email', async () => {
      const user1 = { name: 'User One', email: 'unique.email@example.com', phone: '111222333', passwordHash: 'pass1' };
      await addUser(db, user1.name, user1.phone, user1.email, user1.passwordHash, null);

      const user2 = { name: 'User Two', email: 'unique.email@example.com', phone: '444555666', passwordHash: 'pass2' };
      try {
        await addUser(db, user2.name, user2.phone, user2.email, user2.passwordHash, null);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toMatch(/UNIQUE constraint failed: users.email/i);
      }
    });

    it('should fail to add user with duplicate phone', async () => {
      const user1 = { name: 'User Phone1', email: 'phone1@example.com', phone: '5551234567', passwordHash: 'pass_phone1' };
      await addUser(db, user1.name, user1.phone, user1.email, user1.passwordHash, null);

      const user2 = { name: 'User Phone2', email: 'phone2@example.com', phone: '5551234567', passwordHash: 'pass_phone2' };
      try {
        await addUser(db, user2.name, user2.phone, user2.email, user2.passwordHash, null);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
         expect(error.message).toMatch(/UNIQUE constraint failed: users.phone/i);
      }
    });

    it('findUserByEmail should return null for non-existing email', async () => {
      const foundUser = await findUserByEmail(db, 'non.existent@example.com');
      expect(foundUser).toBeNull();
    });

    it('findUserByPhone should find an existing user by phone', async () => {
      const user = { name: 'User Phone Existing', email: 'phone.existing@example.com', phone: '7778889999', passwordHash: 'pass_existing' };
      await addUser(db, user.name, user.phone, user.email, user.passwordHash, null);

      const foundUser = await findUserByPhone(db, user.phone as string);
      expect(foundUser).not.toBeNull();
      expect(foundUser!.name).toBe(user.name);
      expect(foundUser!.phone).toBe(user.phone);
    });

    it('findUserByPhone should return null for non-existing phone', async () => {
      const foundUser = await findUserByPhone(db, '0000000000');
      expect(foundUser).toBeNull();
    });

    it('initDatabase should create tables', async () => {
      // This test implicitly relies on initDatabase being called in beforeEach.
      // We can try to query the schema or insert data into expected tables.
      // Example: trying to add a family should not fail due to missing table.
      try {
        await addFamily(db, "InitTestFamily");
        const family = await findFamilyByName(db, "InitTestFamily");
        expect(family).not.toBeNull();
        expect(family!.name).toBe("InitTestFamily");
      } catch (e) {
        // If this throws, it might indicate table creation failed.
        expect(true).toBe(false, `Table creation check failed: ${e}`);
      }
    });
  });
});
