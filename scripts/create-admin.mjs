import { createInterface } from "node:readline/promises";
import { loadEnvFile, stdin, stdout } from "node:process";
import * as bcrypt from "bcrypt";
import mongoose from "mongoose";

try {
  loadEnvFile();
} catch (error) {
  if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
    throw error;
  }
}

const BCRYPT_COST = 12;
const MIN_PASSWORD_CHARACTERS = 12;
const MAX_PASSWORD_BYTES = 72;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || !stdout.isTTY) {
      reject(new Error("La contraseña debe ingresarse desde una terminal interactiva"));
      return;
    }

    stdout.write(question);

    let value = "";
    let settled = false;

    const cleanup = () => {
      if (settled) {
        return;
      }

      settled = true;
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };

    const finish = () => {
      cleanup();
      stdout.write("\n");
      resolve(value);
    };

    const cancel = () => {
      cleanup();
      stdout.write("\n");
      reject(new Error("Operación cancelada"));
    };

    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          cancel();
          return;
        }

        if (character === "\r" || character === "\n") {
          finish();
          return;
        }

        if (character === "\u0008" || character === "\u007f") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }

        if (character >= " ") {
          value += character;
          stdout.write("*");
        }
      }
    };

    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validateEmail(email) {
  if (email.length === 0) {
    throw new Error("El email es obligatorio");
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new Error("El email no es válido");
  }
}

function validatePassword(password) {
  if ([...password].length < MIN_PASSWORD_CHARACTERS) {
    throw new Error(
      `La contraseña debe tener al menos ${MIN_PASSWORD_CHARACTERS} caracteres`,
    );
  }

  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    throw new Error(
      `La contraseña no puede superar ${MAX_PASSWORD_BYTES} bytes UTF-8`,
    );
  }
}

async function readEmail() {
  const readline = createInterface({ input: stdin, output: stdout });

  try {
    const answer = await readline.question("Email del administrador: ");
    return normalizeEmail(answer);
  } finally {
    readline.close();
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI no está definida");
  }

  const email = await readEmail();
  validateEmail(email);

  const password = await promptHidden("Contraseña: ");
  validatePassword(password);

  const confirmation = await promptHidden("Confirmá la contraseña: ");

  if (password !== confirmation) {
    throw new Error("Las contraseñas no coinciden");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  await mongoose.connect(uri);

  const database = mongoose.connection.db;

  if (!database) {
    throw new Error("No se pudo obtener la conexión de MongoDB");
  }

  const users = database.collection("users");

  await users.createIndex(
    { email: 1 },
    { unique: true, name: "email_unique" },
  );

  const existingUser = await users.findOne({ email });

  if (existingUser) {
    throw new Error("Ya existe un usuario con ese email");
  }

  const now = new Date();

  await users.insertOne({
    email,
    passwordHash,
    role: "admin",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    __v: 0,
  });

  console.log(`Administrador creado: ${email}`);
}

main()
  .catch((error) => {
    const message =
      error instanceof Error ? error.message : "Error inesperado";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
