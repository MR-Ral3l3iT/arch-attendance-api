import * as fs from 'fs';
import * as path from 'path';
import { ServiceUnavailableException } from '@nestjs/common';
import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';

type ServiceAccountLike = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function resolveCredentialsFromEnv(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY ?? '';
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim();
  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }
  return { projectId, clientEmail, privateKey };
}

function resolveCredentialsFromFile(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!keyPath) {
    return null;
  }
  const absolutePath = path.isAbsolute(keyPath)
    ? keyPath
    : path.join(process.cwd(), keyPath);
  if (!fs.existsSync(absolutePath)) {
    throw new ServiceUnavailableException(
      `Firebase service account file not found at ${absolutePath}`,
    );
  }
  const parsed = JSON.parse(
    fs.readFileSync(absolutePath, 'utf8'),
  ) as ServiceAccountLike;
  const projectId = parsed.project_id?.trim();
  const clientEmail = parsed.client_email?.trim();
  const privateKey = (parsed.private_key ?? '').replace(/\\n/g, '\n').trim();
  if (!projectId || !clientEmail || !privateKey) {
    throw new ServiceUnavailableException(
      'Invalid Firebase service account JSON. Missing project_id, client_email, or private_key.',
    );
  }
  return { projectId, clientEmail, privateKey };
}

function resolveStorageBucket(projectId: string): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET?.trim() || `${projectId}.appspot.com`
  );
}

export function ensureFirebaseAppInitialized(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const fileCreds = resolveCredentialsFromFile();
  const envCreds = resolveCredentialsFromEnv();
  const creds = fileCreds ?? envCreds;

  if (!creds) {
    throw new ServiceUnavailableException(
      'Firebase credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.',
    );
  }

  return initializeApp({
    credential: cert({
      projectId: creds.projectId,
      clientEmail: creds.clientEmail,
      privateKey: creds.privateKey,
    }),
    storageBucket: resolveStorageBucket(creds.projectId),
  });
}

export function getFirebaseStorageBucket() {
  const app = ensureFirebaseAppInitialized();
  return getStorage(app).bucket();
}

export async function uploadBufferToFirebaseStorage(params: {
  folder: string;
  originalName: string;
  mimeType?: string;
  buffer: Buffer;
}): Promise<string> {
  const bucket = getFirebaseStorageBucket();
  const safeFolder = params.folder.replace(/^\/+|\/+$/g, '');
  const inputMimeType = params.mimeType || 'application/octet-stream';
  let uploadBuffer = params.buffer;
  let uploadMimeType = inputMimeType;
  let extension = path.extname(params.originalName) || '.jpg';

  if (inputMimeType.startsWith('image/')) {
    // Optimize image files before upload to reduce storage and bandwidth.
    uploadBuffer = await sharp(params.buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 78 })
      .toBuffer();
    uploadMimeType = 'image/webp';
    extension = '.webp';
  }

  const fileName = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
  const file = bucket.file(fileName);
  await file.save(uploadBuffer, {
    resumable: false,
    contentType: uploadMimeType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

export async function deleteFirebaseStorageFileByUrl(
  fileUrl: string | null | undefined,
): Promise<void> {
  if (!fileUrl) {
    return;
  }
  try {
    const bucket = getFirebaseStorageBucket();
    const publicBase = `https://storage.googleapis.com/${bucket.name}/`;
    if (!fileUrl.startsWith(publicBase)) {
      return;
    }
    const filePath = fileUrl.slice(publicBase.length);
    if (!filePath) {
      return;
    }
    await bucket.file(filePath).delete({ ignoreNotFound: true });
  } catch {
    // ignore
  }
}
