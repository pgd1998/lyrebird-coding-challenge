import Database from 'better-sqlite3';


export const initializeDatabase = (): Database.Database =>{
    const db = new Database('clinic.db'); 

    db.exec (`
        CREATE TABLE IF NOT EXISTS clinicians (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            specialty TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clinician_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (clinician_id) REFERENCES clinicians(id),
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        );
        -- Index for efficient overlap checking
        CREATE INDEX IF NOT EXISTS idx_clinician_times 
        ON appointments(clinician_id, start_time, end_time);

        `)
        console.log('Database initialized successfully');
  return db;
}


let dbInstance: Database.Database;

export const getDatabase = (): Database.Database => {
  if (!dbInstance) {
    dbInstance = initializeDatabase();
  }
  return dbInstance;
};