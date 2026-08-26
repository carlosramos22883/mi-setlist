// ============================================================
// UPLOADS SERVICE — guarda archivos EN EL SISTEMA y los normaliza
// ============================================================
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

@Injectable()
export class UploadsService {
  // Carpeta física donde viven los archivos (dentro de api/)
  private readonly storageDir = path.join(process.cwd(), 'storage', 'uploads');

  constructor() {
    // Crea la carpeta si no existe (al arrancar la API)
    fs.mkdirSync(this.storageDir, { recursive: true });
  }

  // ---------------------------------------------------------
  // Recibe el buffer de una imagen y la guarda cuadrada 512x512
  // ---------------------------------------------------------
  async saveSquareImage(buffer: Buffer, mimetype: string): Promise<string> {
    // Validación de tipo (nunca confíes en el cliente)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimetype)) {
      throw new BadRequestException(
        'Solo se permiten imágenes JPG, PNG o WEBP',
      );
    }

    const filename = `${randomUUID()}.png`; // nombre aleatorio = seguridad
    const destination = path.join(this.storageDir, filename);

    // sharp: recorte cuadrado centrado + redimensión
    // fit:'cover' = llena el cuadrado recortando lo que sobra
    await sharp(buffer)
      .resize(512, 512, { fit: 'cover' })
      .png()
      .toFile(destination);

    // Devolvemos la RUTA RELATIVA (esto es lo que guarda la BD)
    return `uploads/${filename}`;
  }

  // ---------------------------------------------------------
  // Resuelve la ruta física de un archivo para servirlo
  // ---------------------------------------------------------
  resolve(filename: string): string {
    // Seguridad: path.basename evita "../../etc/passwd" (path traversal)
    const safe = path.basename(filename);
    const full = path.join(this.storageDir, safe);
    if (!fs.existsSync(full)) throw new NotFoundException('Archivo no encontrado');
    return full;
  }
}
