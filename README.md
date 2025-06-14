# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Project Status

**Completed Features:**
- User/Family management (creation, updating name, adding members) in `settings.tsx`.
- Basic budget listing in `orcamentos.tsx`.
- Theme (dark/light mode) switching.
- SQLite database integration and initialization.

**Partially Implemented/Placeholder Features:**
- Dashboard: Generic DB item list, needs to be a financial overview.
- Orçamentos (Budgets): Listing is done. Add/Edit/Delete actions are placeholders.
- Débitos (Debts/Expenses): Placeholder screen.
- Metas (Goals): Placeholder screen.
- Transações (Transactions): Placeholder screen.

**Missing Core Financial Features:**
- Transaction recording (income, expenses).
- Linking transactions to budgets.
- Categorization of transactions.
- Financial reporting/summaries on the dashboard.
- Debt tracking.
- Savings goal tracking.
- User authentication (currently uses a hardcoded user ID).

## Roadmap

1.  **Enhance `orcamentos.tsx` (Budgets Screen):** Implement full CRUD functionality.
2.  **Implement `transacoes.tsx` (Transactions Screen):** Add transaction recording, listing, editing, and deletion.
3.  **Develop `debitos.tsx` (Debts/Expenses Screen):** Implement CRUD for debts.
4.  **Develop `metas.tsx` (Goals Screen):** Implement CRUD for financial goals.
5.  **Transform `dashboard.tsx` into a Financial Overview:** Display summaries and progress.
6.  **Implement User Authentication:** Secure login/signup and session management.
7.  **Refine Database Structure:** Define all tables and relationships, including a `categories` table.
8.  **Add Unit and Integration Tests.**

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Database Usage

This project uses `expo-sqlite` for local database storage. The core database logic is located in `src/database/index.ts`.

### Importing Database Functions

To use the database functionalities, import the necessary functions from the module:

```typescript
import {
  getDBConnection,
  initDatabase,
  addItem,
  getAllItems,
  updateItem,
  deleteItem
} from '../src/database'; // Adjust the path based on your file's location
```

### Getting a Database Connection

First, you need to get a database connection object.

```typescript
const db = getDBConnection();
```

### Initializing the Database

Before performing any operations, ensure the database and necessary tables are initialized. The `initDatabase` function handles the creation of an 'items' table if it doesn't exist.

```typescript
initDatabase(db)
  .then(() => {
    console.log('Database initialized');
    // You can now use CRUD operations
  })
  .catch(error => {
    console.error('Database initialization failed:', error);
  });
```

### CRUD Operations

The module provides functions for Create, Read, Update, and Delete operations on the 'items' table. All CRUD functions return a Promise.

**1. Add an Item**

Adds a new item to the 'items' table. Resolves with the ID of the newly inserted item.

```typescript
addItem(db, 'My New Item')
  .then(insertId => {
    console.log('Item added with ID:', insertId);
  })
  .catch(error => {
    console.error('Failed to add item:', error);
  });
```

**2. Get All Items**

Retrieves all items from the 'items' table. Resolves with an array of item objects (e.g., `{ id: number, name: string }[]`).

```typescript
getAllItems(db)
  .then(items => {
    console.log('Fetched items:', items);
  })
  .catch(error => {
    console.error('Failed to fetch items:', error);
  });
```

**3. Update an Item**

Updates the name of an existing item by its ID. Resolves with the number of updated rows (should be 1 if successful).

```typescript
updateItem(db, 1, 'Updated Item Name') // Assuming item with ID 1 exists
  .then(rowsAffected => {
    if (rowsAffected > 0) {
      console.log('Item updated successfully');
    } else {
      console.log('Item not found or not updated');
    }
  })
  .catch(error => {
    console.error('Failed to update item:', error);
  });
```

**4. Delete an Item**

Removes an item from the 'items' table by its ID. Resolves with the number of deleted rows (should be 1 if successful).

```typescript
deleteItem(db, 1) // Assuming item with ID 1 exists
  .then(rowsAffected => {
    if (rowsAffected > 0) {
      console.log('Item deleted successfully');
    } else {
      console.log('Item not found or not deleted');
    }
  })
  .catch(error => {
    console.error('Failed to delete item:', error);
  });
```
