package com.example.demo;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;

public class DbTest {

    @Test
    void testConnection() throws Exception {
        String url = "jdbc:postgresql://ep-plain-snow-a166tfho-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
        try (Connection conn = DriverManager.getConnection(url, "neondb_owner", "npg_cd2f0NkwMstu")) {
            System.out.println("SUCCESS: " + conn.getMetaData().getDatabaseProductVersion());
        }
    }
}
