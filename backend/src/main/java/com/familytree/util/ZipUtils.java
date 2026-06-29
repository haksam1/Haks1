package com.familytree.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

public class ZipUtils {

    public static byte[] compressStringToZip(String data, String filename) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            ZipEntry entry = new ZipEntry(filename);
            zos.putNextEntry(entry);
            zos.write(data.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        return baos.toByteArray();
    }

    public static String decompressZipToString(byte[] zipBytes) throws IOException {
        ByteArrayInputStream bais = new ByteArrayInputStream(zipBytes);
        try (ZipInputStream zis = new ZipInputStream(bais)) {
            ZipEntry entry = zis.getNextEntry();
            if (entry != null) {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buffer = new byte[4096];
                int len;
                while ((len = zis.read(buffer)) > 0) {
                    baos.write(buffer, 0, len);
                }
                return baos.toString(StandardCharsets.UTF_8.name());
            }
        }
        throw new IOException("No entry found in ZIP archive");
    }
}
