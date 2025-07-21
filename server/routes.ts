import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { withAuditContext, type AuditContext } from "./audit";

import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";
import {
  insertOccupationSchema,
  insertSynonymSchema,
  insertTaxonomySourceSchema,
  insertTaxonomyGroupSchema,
  insertTaxonomyRelationshipSchema,
  insertOccupationTaxonomyMappingSchema,
  insertOccupationSourceMappingSchema,
  occupationSynonyms,
  occupationSourceMapping,
  occupations,
  taxonomyRelationships,
  synonyms,
  auditLog,
} from "@shared/schema";
import { Pool } from "pg";

// Hardcoded admin credentials
const ADMIN_USERNAME = "panda";
const ADMIN_PASSWORD_HASH =
  "$2b$10$wdCPSp3BEHXRP64Y817QAO87ud9AJz7CYuCsMhKl8xa1ca1F/PdiS";

// Helper function to create audit context from request
function createAuditContext(req: any): AuditContext {
  return {
    userId: "admin", // TODO: Get this from session/JWT when authentication is implemented
    sessionId: (req as any).sessionID || "unknown",
    ipAddress: req.ip || (req.connection as any)?.remoteAddress || "unknown",
    userAgent: req.get('User-Agent') || "unknown",
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      if (username !== ADMIN_USERNAME) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        ADMIN_PASSWORD_HASH,
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Dashboard
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Dashboard Statistics
  app.get("/api/dashboard/occupation-count-per-source", async (req, res) => {
    try {
      const stats = await storage.getOccupationCountPerSource();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching occupation count per source:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch occupation statistics" });
    }
  });

  app.get("/api/dashboard/synonym-count-per-source", async (req, res) => {
    try {
      const stats = await storage.getSynonymCountPerSource();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching synonym count per source:", error);
      res.status(500).json({ message: "Failed to fetch synonym statistics" });
    }
  });

  app.get(
    "/api/dashboard/average-synonyms-per-occupation",
    async (req, res) => {
      try {
        const average = await storage.getAverageSynonymsPerOccupation();
        res.json({ averageSynonymsPerOccupation: average });
      } catch (error) {
        console.error("Error fetching average synonyms per occupation:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch average synonyms statistics" });
      }
    },
  );

  app.get("/api/dashboard/unlinked-occupations-count", async (req, res) => {
    try {
      const count = await storage.getUnlinkedOccupationCount();
      res.json({ unlinkedOccupationCount: count });
    } catch (error) {
      console.error("Error fetching unlinked occupations count:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch unlinked occupations statistics" });
    }
  });

  app.get("/api/dashboard/occupation-most-synonyms", async (req, res) => {
    try {
      const occupation = await storage.getOccupationWithMostSynonyms();
      res.json(occupation);
    } catch (error) {
      console.error("Error fetching occupation with most synonyms:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch occupation with most synonyms" });
    }
  });

  app.get("/api/dashboard/occupation-fewest-synonyms", async (req, res) => {
    try {
      const occupation = await storage.getOccupationWithFewestSynonyms();
      res.json(occupation);
    } catch (error) {
      console.error("Error fetching occupation with fewest synonyms:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch occupation with fewest synonyms" });
    }
  });

  // Recent Activity Dashboard Routes
  app.get("/api/dashboard/last-added-occupations", async (req, res) => {
    try {
      const occupations = await storage.getLastAddedOccupations();
      res.json(occupations);
    } catch (error) {
      console.error("Error fetching last added occupations:", error);
      res.status(500).json({ message: "Failed to fetch recent occupations" });
    }
  });

  app.get("/api/dashboard/last-added-synonyms", async (req, res) => {
    try {
      const synonyms = await storage.getLastAddedSynonyms();
      res.json(synonyms);
    } catch (error) {
      console.error("Error fetching last added synonyms:", error);
      res.status(500).json({ message: "Failed to fetch recent synonyms" });
    }
  });

  // Data Completeness Dashboard Routes
  app.get("/api/dashboard/occupations-without-source", async (req, res) => {
    try {
      const count = await storage.getOccupationsWithoutSource();
      res.json({ occupationsWithoutSource: count });
    } catch (error) {
      console.error("Error fetching occupations without source:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch occupations without source count" });
    }
  });

  app.get("/api/dashboard/synonyms-without-source", async (req, res) => {
    try {
      const count = await storage.getSynonymsWithoutSource();
      res.json({ synonymsWithoutSource: count });
    } catch (error) {
      console.error("Error fetching synonyms without source:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch synonyms without source count" });
    }
  });

  // Global Search
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results = await storage.globalSearch(q);
      res.json(results);
    } catch (error) {
      console.error("Error performing global search:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Taxonomy Sources
  app.get("/api/taxonomy-sources", async (req, res) => {
    try {
      const sources = await storage.getTaxonomySources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching taxonomy sources:", error);
      res.status(500).json({ message: "Failed to fetch taxonomy sources" });
    }
  });

  app.post("/api/taxonomy-sources", async (req, res) => {
    try {
      const validatedData = insertTaxonomySourceSchema.parse(req.body);
      const auditContext = createAuditContext(req);
      const source = await storage.createTaxonomySource(validatedData, auditContext);
      res.status(201).json(source);
    } catch (error) {
      console.error("Error creating taxonomy source:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put("/api/taxonomy-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTaxonomySourceSchema
        .partial()
        .parse(req.body);
      const auditContext = createAuditContext(req);
      const source = await storage.updateTaxonomySource(id, validatedData, auditContext);

      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }

      res.json(source);
    } catch (error) {
      console.error("Error updating taxonomy source:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/taxonomy-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const auditContext = createAuditContext(req);
      const deleted = await storage.deleteTaxonomySource(id, auditContext);

      if (!deleted) {
        return res.status(404).json({ message: "Source not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting taxonomy source:", error);
      res.status(500).json({ message: "Failed to delete source" });
    }
  });

  // Synonyms
  app.get("/api/synonyms", async (req, res) => {
    try {
      const {
        search,
        language,
        sourceId: sourceIdParam,
        withoutSource: withoutSourceParam,
        page = "1",
        limit = "50",
      } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Parse sourceId - convert string to number if provided and not empty
      let sourceId: number | undefined;
      if (sourceIdParam && sourceIdParam !== "") {
        sourceId = parseInt(sourceIdParam as string);
      }

      // Parse withoutSource - convert string "true" to boolean
      const withoutSource = withoutSourceParam === "true";

      const result = await storage.getSynonyms({
        search: search as string,
        language: language as string,
        sourceId,
        withoutSource,
        limit: limitNum,
        offset,
      });

      res.json({
        ...result,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum),
      });
    } catch (error) {
      console.error("Error fetching synonyms:", error);
      res.status(500).json({ message: "Failed to fetch synonyms" });
    }
  });

  app.get("/api/synonyms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const synonym = await storage.getSynonym(id);

      if (!synonym) {
        return res.status(404).json({ message: "Synonym not found" });
      }

      res.json(synonym);
    } catch (error) {
      console.error("Error fetching synonym:", error);
      res.status(500).json({ message: "Failed to fetch synonym" });
    }
  });

  app.post("/api/synonyms", async (req, res) => {
    try {
      // Validate title is not empty after trimming
      if (!req.body.title || req.body.title.trim() === "") {
        return res.status(400).json({ message: "Synonym title is required." });
      }

      // Trim the title before validation
      req.body.title = req.body.title.trim();

      const validatedData = insertSynonymSchema.parse(req.body);

      // Check for duplicate synonym titles
      const existingSynonym = await db
        .select()
        .from(synonyms)
        .where(eq(synonyms.title, validatedData.title))
        .limit(1);

      if (existingSynonym.length > 0) {
        return res.status(409).json({
          message: `A synonym with the title "${validatedData.title}" already exists`,
        });
      }

      const auditContext = createAuditContext(req);

      const synonym = await storage.createSynonym(validatedData, auditContext);
      res.status(201).json(synonym);
    } catch (error) {
      console.error("Error creating synonym:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put("/api/synonyms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate title is not empty after trimming
      if (!req.body.title || req.body.title.trim() === "") {
        return res.status(400).json({ message: "Synonym title is required." });
      }
      
      // Trim the title before saving
      req.body.title = req.body.title.trim();
      
      const validatedData = insertSynonymSchema.partial().parse(req.body);
      
      // Include sourceId in the update data (it's not part of the synonym schema)
      const auditContext = createAuditContext(req);
      const synonym = await storage.updateSynonym(id, {
        ...validatedData,
        sourceId: req.body.sourceId ?? null
      }, auditContext);

      if (!synonym) {
        return res.status(404).json({ message: "Synonym not found" });
      }

      res.json(synonym);
    } catch (error) {
      console.error("Error updating synonym:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/synonyms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const auditContext = createAuditContext(req);
      const deleted = await storage.deleteSynonym(id, auditContext);

      if (!deleted) {
        return res.status(404).json({ message: "Synonym not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting synonym:", error);
      res.status(500).json({ message: "Failed to delete synonym" });
    }
  });

  // Occupations
  app.get("/api/occupations", async (req, res) => {
    try {
      const {
        search,
        escoLevel,
        careerLevel,
        language,
        sourceId: sourceIdParam,
        withoutSource: withoutSourceParam,
        page = "1",
        limit = "50",
        unlinked,
      } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Parse sourceId - convert string to number if provided and not empty
      let sourceId: number | undefined;
      if (sourceIdParam && sourceIdParam !== "") {
        sourceId = parseInt(sourceIdParam as string);
      }

      // Parse withoutSource - convert string "true" to boolean
      const withoutSource = withoutSourceParam === "true";

      const result = await storage.getOccupations({
        search: search as string,
        escoLevel: escoLevel as string,
        careerLevel: careerLevel as string,
        language: language as string,
        sourceId,
        withoutSource,
        unlinked: unlinked === "true",
        limit: limitNum,
        offset,
      });

      res.json({
        ...result,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum),
      });
    } catch (error) {
      console.error("Error fetching occupations:", error);
      res.status(500).json({ message: "Failed to fetch occupations" });
    }
  });

  app.get("/api/occupations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const occupation = await storage.getOccupation(id);

      if (!occupation) {
        return res.status(404).json({ message: "Occupation not found" });
      }

      // Get related synonyms
      const synonymRelationships = await storage.getSynonymRelationships(id);

      res.json({
        ...occupation,
        synonyms: synonymRelationships,
      });
    } catch (error) {
      console.error("Error fetching occupation:", error);
      res.status(500).json({ message: "Failed to fetch occupation" });
    }
  });

  app.get("/api/occupations/:id/details", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const details = await storage.getOccupationDetails(id);

      if (!details) {
        return res.status(404).json({ message: "Occupation not found" });
      }

      res.json(details);
    } catch (error) {
      console.error("Error fetching occupation details:", error);
      res.status(500).json({ message: "Failed to fetch occupation details" });
    }
  });

  app.post("/api/occupations", async (req, res) => {
    try {
      const {
        occupation: occupationData,
        synonyms: synonymData = [],
        parentRelation,
        sourceId,
      } = req.body;

      // Validate preferred_label_en is not empty after trimming
      if (!occupationData.preferredLabelEn || occupationData.preferredLabelEn.trim() === "") {
        return res.status(400).json({ message: "Preferred label must not be empty." });
      }

      // Trim the preferred label before validation
      occupationData.preferredLabelEn = occupationData.preferredLabelEn.trim();

      const validatedOccupation = insertOccupationSchema.parse(occupationData);

      // Check for duplicate English title
      if (validatedOccupation.preferredLabelEn) {
        const existingOccupations = await storage.getOccupations({
          search: validatedOccupation.preferredLabelEn.trim(),
        });

        const exactMatch = existingOccupations.data.find(
          (occ) =>
            occ.preferredLabelEn?.toLowerCase() ===
            validatedOccupation.preferredLabelEn?.trim().toLowerCase(),
        );

        if (exactMatch) {
          return res.status(400).json({
            message: "An occupation with this English name already exists",
          });
        }
      }

      // Create audit context and wrap the entire operation
      const auditContext = createAuditContext(req);
      
      const result = await withAuditContext(auditContext, async (clientDb) => {
        return await clientDb.transaction(async (tx) => {
            // 1. Insert occupation
            const [occupation] = await tx
              .insert(occupations)
              .values(validatedOccupation)
              .returning();

        // 2. Handle synonyms
        const synonymIds = [];

        for (const synonym of synonymData) {
          if (synonym.isNew) {
            // Create new synonym
            const validatedSynonym = insertSynonymSchema.parse({
              title: synonym.title,
              language: synonym.language || "en",
            });
            const [newSynonym] = await tx
              .insert(synonyms)
              .values(validatedSynonym)
              .returning();
            synonymIds.push(newSynonym.id);
          } else {
            // Use existing synonym
            synonymIds.push(synonym.id);
          }
        }

        // 3. Link synonyms to occupation
        for (const synonymId of synonymIds) {
          await tx.insert(occupationSynonyms).values({
            occupationId: occupation.id,
            synonymId,
          });
        }

        // 4. Handle parent relationship with validation
        if (parentRelation) {
          const { type, id: parentId } = parentRelation;
          const parentType = type === "occupation" ? "occupation" : "esco_group";

          // Validate parent type
          if (!["occupation", "esco_group"].includes(parentType)) {
            throw new Error("Parent type must be 'occupation' or 'esco_group'");
          }

          // Check for circular relationships (prevent child from becoming parent of its ancestor)
          if (parentType === "occupation") {
            // Check if the new occupation would be an ancestor of parentId
            const circularCheck = await tx.execute(sql`
              WITH RECURSIVE ancestor_check AS (
                -- Base case: start with the proposed parent
                SELECT 
                  tr.source_entity_type,
                  tr.source_entity_id,
                  CASE 
                    WHEN tr.source_entity_type = 'occupation' THEN o.preferred_label_en
                    WHEN tr.source_entity_type = 'esco_group' THEN tg.preferred_label_en
                  END as entity_name,
                  1 as level
                FROM taxonomy_relationships tr
                LEFT JOIN occupations o ON tr.source_entity_type = 'occupation' AND tr.source_entity_id = o.id
                LEFT JOIN taxonomy_groups tg ON tr.source_entity_type = 'esco_group' AND tr.source_entity_id = tg.id
                WHERE tr.target_entity_type = 'occupation'
                  AND tr.target_entity_id = ${parentId}
                  AND tr.relationship_type = 'contains'
                
                UNION ALL
                
                -- Recursive case: find ancestors of ancestors
                SELECT 
                  tr.source_entity_type,
                  tr.source_entity_id,
                  CASE 
                    WHEN tr.source_entity_type = 'occupation' THEN o.preferred_label_en
                    WHEN tr.source_entity_type = 'esco_group' THEN tg.preferred_label_en
                  END as entity_name,
                  ac.level + 1
                FROM taxonomy_relationships tr
                LEFT JOIN occupations o ON tr.source_entity_type = 'occupation' AND tr.source_entity_id = o.id
                LEFT JOIN taxonomy_groups tg ON tr.source_entity_type = 'esco_group' AND tr.source_entity_id = tg.id
                INNER JOIN ancestor_check ac ON tr.target_entity_type = ac.source_entity_type 
                  AND tr.target_entity_id = ac.source_entity_id
                WHERE tr.relationship_type = 'contains'
                  AND ac.level < 10  -- Prevent infinite recursion
              )
              SELECT * FROM ancestor_check 
              WHERE source_entity_type = 'occupation' 
                AND source_entity_id = ${occupation.id}
              LIMIT 1
            `);

            if (circularCheck.rows.length > 0) {
              const circularAncestor = circularCheck.rows[0] as any;
              throw new Error(`Circular relationship detected! The occupation you're trying to assign as parent is actually a descendant of this occupation. This would create an invalid hierarchy where "${circularAncestor.entity_name || 'Unknown'}" would be both ancestor and descendant.`);
            }
          }

          // Prevent self-reference
          if (parentType === "occupation" && parentId === occupation.id) {
            throw new Error("An occupation cannot be its own parent. Self-reference relationships are not allowed.");
          }

          // Check if parent exists
          if (parentType === "occupation") {
            const parentExists = await tx.execute(sql`
              SELECT id FROM occupations WHERE id = ${parentId}
            `);
            if (parentExists.rows.length === 0) {
              throw new Error(`Parent occupation with ID ${parentId} does not exist.`);
            }
          } else {
            const parentExists = await tx.execute(sql`
              SELECT id FROM taxonomy_groups WHERE id = ${parentId}
            `);
            if (parentExists.rows.length === 0) {
              throw new Error(`Parent taxonomy group with ID ${parentId} does not exist.`);
            }
          }

          // Insert contains relationship (parent contains child)
          await tx.insert(taxonomyRelationships).values({
            sourceEntityType: parentType,
            sourceEntityId: parentId,
            targetEntityType: "occupation",
            targetEntityId: occupation.id,
            relationshipType: "contains",
          });

          // Insert inverse relationship (child contained_by parent)
          await tx.insert(taxonomyRelationships).values({
            sourceEntityType: "occupation",
            sourceEntityId: occupation.id,
            targetEntityType: parentType,
            targetEntityId: parentId,
            relationshipType: "contained_by",
          });
        }

        // 5. Handle source mapping
        if (sourceId) {
          await tx.insert(occupationSourceMapping).values({
            occupationId: occupation.id,
            sourceId,
            isVerified: false,
            confidenceScore: "1.00",
            isModerated: false,
          });
        }

            return occupation;
          });
        });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating occupation:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put("/api/occupations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Handle direct occupation update format (from edit modal)
      if (req.body.preferredLabelEn !== undefined) {
        // Validate preferred_label_en is not empty after trimming
        if (!req.body.preferredLabelEn || req.body.preferredLabelEn.trim() === "") {
          return res.status(400).json({ message: "Preferred label must not be empty." });
        }
        
        // Trim the preferred label before saving
        req.body.preferredLabelEn = req.body.preferredLabelEn.trim();
        
        // Arabic label is optional - allow empty strings but convert to null for database
        if (req.body.preferredLabelAr === "") {
          req.body.preferredLabelAr = null;
        }
        
        const validatedData = insertOccupationSchema.partial().parse(req.body);
        
        // Include sourceId in the update data (it's not part of the occupation schema)
        const auditContext = createAuditContext(req);
        
        try {
          console.log(`Updating occupation ${id} with data:`, validatedData);
          const occupation = await storage.updateOccupation(id, {
            ...validatedData,
            sourceId: req.body.sourceId ?? null
          }, auditContext);

          console.log(`Update result for occupation ${id}:`, occupation ? 'SUCCESS' : 'NOT FOUND');

          if (!occupation) {
            return res.status(404).json({ message: "Occupation not found" });
          }

          return res.json(occupation);
        } catch (updateError) {
          console.error("Error in storage.updateOccupation:", updateError);
          return res.status(500).json({ message: "Failed to update occupation" });
        }
      }

      // Handle complex update format (with synonyms and relations)
      const {
        occupation: occupationData,
        synonyms: synonymData = [],
        parentRelation,
        sourceId,
      } = req.body;

      const validatedOccupation = insertOccupationSchema
        .partial()
        .parse(occupationData);

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // 1. Update occupation
        const [occupation] = await tx
          .update(occupations)
          .set(validatedOccupation)
          .where(eq(occupations.id, id))
          .returning();

        if (!occupation) {
          throw new Error("Occupation not found");
        }

        // 2. Clear existing synonym relationships
        await tx
          .delete(occupationSynonyms)
          .where(eq(occupationSynonyms.occupationId, id));

        // 3. Handle synonyms
        const synonymIds = [];

        for (const synonym of synonymData) {
          if (synonym.isNew) {
            // Create new synonym
            const validatedSynonym = insertSynonymSchema.parse({
              title: synonym.title,
              language: synonym.language || "en",
            });
            const [newSynonym] = await tx
              .insert(synonyms)
              .values(validatedSynonym)
              .returning();
            synonymIds.push(newSynonym.id);
          } else {
            // Use existing synonym
            synonymIds.push(synonym.id);
          }
        }

        // 4. Link synonyms to occupation
        for (const synonymId of synonymIds) {
          await tx.insert(occupationSynonyms).values({
            occupationId: occupation.id,
            synonymId,
          });
        }

        // 5. Clear existing taxonomy relationships
        await tx
          .delete(taxonomyRelationships)
          .where(eq(taxonomyRelationships.sourceEntityId, id));
        await tx
          .delete(taxonomyRelationships)
          .where(eq(taxonomyRelationships.targetEntityId, id));

        // 6. Handle parent relationship
        if (parentRelation) {
          const { type, id: parentId } = parentRelation;

          // Insert contains relationship (parent contains child)
          await tx.insert(taxonomyRelationships).values({
            sourceEntityType:
              type === "occupation" ? "occupation" : "esco_group",
            sourceEntityId: parentId,
            targetEntityType: "occupation",
            targetEntityId: occupation.id,
            relationshipType: "contains",
          });

          // Insert inverse relationship (child contained_by parent)
          await tx.insert(taxonomyRelationships).values({
            sourceEntityType: "occupation",
            sourceEntityId: occupation.id,
            targetEntityType:
              type === "occupation" ? "occupation" : "esco_group",
            targetEntityId: parentId,
            relationshipType: "contained_by",
          });
        }

        // 7. Clear existing source mapping
        await tx
          .delete(occupationSourceMapping)
          .where(eq(occupationSourceMapping.occupationId, id));

        // 8. Handle source mapping
        if (sourceId) {
          await tx.insert(occupationSourceMapping).values({
            occupationId: occupation.id,
            sourceId,
            isVerified: false,
            confidenceScore: "1.00",
            isModerated: false,
          });
        }

        return occupation;
      });

      res.json(result);
    } catch (error) {
      console.error("Error updating occupation:", error);
      if (error instanceof Error && error.message === "Occupation not found") {
        res.status(404).json({ message: "Occupation not found" });
      } else {
        res.status(400).json({ message: "Invalid data" });
      }
    }
  });

  app.delete("/api/occupations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First check if the occupation exists
      console.log(`Attempting to delete occupation with ID: ${id}`);
      const existingOccupation = await storage.getOccupation(id);
      console.log(`Occupation ${id} exists:`, existingOccupation ? 'YES' : 'NO');
      
      if (!existingOccupation) {
        console.log(`Occupation ${id} not found in database`);
        return res.status(404).json({ message: "Occupation not found" });
      }
      
      const auditContext = createAuditContext(req);
      const deleted = await storage.deleteOccupation(id, auditContext);
      
      console.log(`Delete operation result for occupation ${id}:`, deleted ? 'SUCCESS' : 'FAILED');

      if (!deleted) {
        console.log(`Failed to delete occupation ${id} - unknown reason`);
        return res.status(404).json({ message: "Occupation not found" });
      }

      console.log(`Successfully deleted occupation ${id}`);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting occupation:", error);
      res.status(500).json({ message: "Failed to delete occupation" });
    }
  });

  // Get occupation synonyms
  app.get("/api/occupations/:id/synonyms", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Get synonyms through occupation_synonyms join
      const synonymsResult = await db
        .select({
          id: synonyms.id,
          title: synonyms.title,
        })
        .from(occupationSynonyms)
        .innerJoin(synonyms, eq(occupationSynonyms.synonymId, synonyms.id))
        .where(eq(occupationSynonyms.occupationId, id));

      res.json(synonymsResult);
    } catch (error) {
      console.error("Error fetching occupation synonyms:", error);
      res.status(500).json({ message: "Failed to fetch occupation synonyms" });
    }
  });

  // Merge occupations
  app.post("/api/occupations/merge", async (req, res) => {
    try {
      const { sourceId, targetId } = req.body;

      if (!sourceId || !targetId) {
        return res
          .status(400)
          .json({ message: "Source and target occupation IDs are required" });
      }

      if (sourceId === targetId) {
        return res
          .status(400)
          .json({ message: "Cannot merge an occupation with itself" });
      }

      const success = await storage.mergeOccupations(
        parseInt(sourceId),
        parseInt(targetId),
      );

      if (success) {
        res.json({ message: "Occupations merged successfully" });
      } else {
        res.status(500).json({ message: "Failed to merge occupations" });
      }
    } catch (error) {
      console.error("Error merging occupations:", error);
      res
        .status(500)
        .json({ message: error instanceof Error ? error.message : "Failed to merge occupations" });
    }
  });

  // Update occupation relationship with transaction
  app.put("/api/occupations/:id/relationship", async (req, res) => {
    try {
      const occupationId = parseInt(req.params.id);
      const { parentType, parentId } = req.body;

      if (!parentType || !parentId) {
        return res
          .status(400)
          .json({ message: "Parent type and ID are required" });
      }

      if (!["occupation", "esco_group"].includes(parentType)) {
        return res.status(400).json({
          message: "Parent type must be 'occupation' or 'esco_group'",
        });
      }

      // 1. Check if occupation already has a parent
      const currentParentQuery = await db.execute(sql`
        SELECT 
          tr.source_entity_type,
          tr.source_entity_id,
          CASE 
            WHEN tr.source_entity_type = 'occupation' THEN o.preferred_label_en
            WHEN tr.source_entity_type = 'esco_group' THEN tg.preferred_label_en
          END as parent_name
        FROM taxonomy_relationships tr
        LEFT JOIN occupations o ON tr.source_entity_type = 'occupation' AND tr.source_entity_id = o.id
        LEFT JOIN taxonomy_groups tg ON tr.source_entity_type = 'esco_group' AND tr.source_entity_id = tg.id
        WHERE tr.target_entity_type = 'occupation'
          AND tr.target_entity_id = ${occupationId}
          AND tr.relationship_type = 'contains'
      `);

      // If occupation already has a parent and we're trying to assign a different one
      if (currentParentQuery.rows.length > 0) {
        const currentParent = currentParentQuery.rows[0] as any;
        const currentParentType = currentParent.source_entity_type;
        const currentParentId = currentParent.source_entity_id;
        const currentParentName = currentParent.parent_name || 'Unknown';

        // Check if we're trying to assign a different parent
        if (currentParentType !== parentType || currentParentId !== parentId) {
          return res.status(400).json({
            message: `This occupation is already linked to parent "${currentParentName}" (${currentParentType} ID: ${currentParentId}). Multiple parents are not allowed. Please remove the existing relationship first if you want to assign a new parent.`
          });
        }

        // If we're trying to assign the same parent, just return success
        return res.json({ 
          message: `Relationship already exists with the specified parent "${currentParentName}" (${currentParentType} ID: ${currentParentId})`
        });
      }

      // 2. Check for circular relationships (prevent child from becoming parent of its ancestor)
      if (parentType === "occupation") {
        // Check if occupationId is an ancestor of parentId
        const circularCheck = await db.execute(sql`
          WITH RECURSIVE ancestor_check AS (
            -- Base case: start with the proposed parent
            SELECT 
              tr.source_entity_type,
              tr.source_entity_id,
              CASE 
                WHEN tr.source_entity_type = 'occupation' THEN o.preferred_label_en
                WHEN tr.source_entity_type = 'esco_group' THEN tg.preferred_label_en
              END as entity_name,
              1 as level
            FROM taxonomy_relationships tr
            LEFT JOIN occupations o ON tr.source_entity_type = 'occupation' AND tr.source_entity_id = o.id
            LEFT JOIN taxonomy_groups tg ON tr.source_entity_type = 'esco_group' AND tr.source_entity_id = tg.id
            WHERE tr.target_entity_type = 'occupation'
              AND tr.target_entity_id = ${parentId}
              AND tr.relationship_type = 'contains'
            
            UNION ALL
            
            -- Recursive case: find ancestors of ancestors
            SELECT 
              tr.source_entity_type,
              tr.source_entity_id,
              CASE 
                WHEN tr.source_entity_type = 'occupation' THEN o.preferred_label_en
                WHEN tr.source_entity_type = 'esco_group' THEN tg.preferred_label_en
              END as entity_name,
              ac.level + 1
            FROM taxonomy_relationships tr
            LEFT JOIN occupations o ON tr.source_entity_type = 'occupation' AND tr.source_entity_id = o.id
            LEFT JOIN taxonomy_groups tg ON tr.source_entity_type = 'esco_group' AND tr.source_entity_id = tg.id
            INNER JOIN ancestor_check ac ON tr.target_entity_type = ac.source_entity_type 
              AND tr.target_entity_id = ac.source_entity_id
            WHERE tr.relationship_type = 'contains'
              AND ac.level < 10  -- Prevent infinite recursion
          )
          SELECT * FROM ancestor_check 
          WHERE source_entity_type = 'occupation' 
            AND source_entity_id = ${occupationId}
          LIMIT 1
        `);

        if (circularCheck.rows.length > 0) {
          const circularAncestor = circularCheck.rows[0] as any;
          return res.status(400).json({
            message: `Circular relationship detected! The occupation you're trying to assign as parent is actually a descendant of the current occupation. This would create an invalid hierarchy where "${circularAncestor.entity_name || 'Unknown'}" would be both ancestor and descendant.`
          });
        }
      }

      // 3. Prevent self-reference
      if (parentType === "occupation" && parentId === occupationId) {
        return res.status(400).json({
          message: "An occupation cannot be its own parent. Self-reference relationships are not allowed."
        });
      }

      // Start transaction for new relationship creation
      await db.execute(sql`BEGIN`);

      try {
        // 2. Insert new relationship
        await db.execute(sql`
          INSERT INTO taxonomy_relationships (
            source_entity_type,
            source_entity_id,
            target_entity_type,
            target_entity_id,
            relationship_type,
            created_at
          )
          VALUES (
            ${parentType},
            ${parentId},
            'occupation',
            ${occupationId},
            'contains',
            NOW()
          )
        `);

        // Insert inverse relationship
        await db.execute(sql`
          INSERT INTO taxonomy_relationships (
            source_entity_type,
            source_entity_id,
            target_entity_type,
            target_entity_id,
            relationship_type,
            created_at
          )
          VALUES (
            'occupation',
            ${occupationId},
            ${parentType},
            ${parentId},
            'contained_by',
            NOW()
          )
        `);

        // Commit transaction
        await db.execute(sql`COMMIT`);

        res.json({ message: "Relationship created successfully" });
      } catch (error) {
        // Rollback transaction on error
        await db.execute(sql`ROLLBACK`);
        throw error;
      }
    } catch (error) {
      console.error("Error updating occupation relationship:", error);
      res.status(500).json({ message: "Failed to update relationship" });
    }
  });

  // Taxonomy Groups
  app.get("/api/taxonomy-groups", async (req, res) => {
    try {
      const { search, level, parentId } = req.query;
      const groups = await storage.getTaxonomyGroups({
        search: search as string,
        level: level ? parseInt(level as string) : undefined,
        parentId: parentId ? parseInt(parentId as string) : undefined,
      });
      res.json(groups);
    } catch (error) {
      console.error("Error fetching taxonomy groups:", error);
      res.status(500).json({ message: "Failed to fetch taxonomy groups" });
    }
  });

  app.get("/api/taxonomy-groups/hierarchy", async (req, res) => {
    try {
      const hierarchy = await storage.getTaxonomyHierarchy();
      res.json(hierarchy);
    } catch (error) {
      console.error("Error fetching taxonomy hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch taxonomy hierarchy" });
    }
  });

  app.get("/api/taxonomy-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await storage.getTaxonomyGroup(id);

      if (!group) {
        return res.status(404).json({ message: "Taxonomy group not found" });
      }

      // Get children
      const children = await storage.getTaxonomyGroups({ parentId: id });

      res.json({
        ...group,
        children,
      });
    } catch (error) {
      console.error("Error fetching taxonomy group:", error);
      res.status(500).json({ message: "Failed to fetch taxonomy group" });
    }
  });

  app.post("/api/taxonomy-groups", async (req, res) => {
    try {
      const validatedData = insertTaxonomyGroupSchema.parse(req.body);
      const group = await storage.createTaxonomyGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating taxonomy group:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put("/api/taxonomy-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTaxonomyGroupSchema.partial().parse(req.body);
      const group = await storage.updateTaxonomyGroup(id, validatedData);

      if (!group) {
        return res.status(404).json({ message: "Taxonomy group not found" });
      }

      res.json(group);
    } catch (error) {
      console.error("Error updating taxonomy group:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/taxonomy-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTaxonomyGroup(id);

      if (!deleted) {
        return res.status(404).json({ message: "Taxonomy group not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting taxonomy group:", error);
      res.status(500).json({ message: "Failed to delete taxonomy group" });
    }
  });

  // Synonym Relationships - redirect to occupation-synonyms
  app.post("/api/synonym-relationships", async (req, res) => {
    try {
      const { synonymId, occupationId } = req.body;

      if (!synonymId || !occupationId) {
        return res
          .status(400)
          .json({ message: "synonymId and occupationId are required" });
      }

      // Use the occupation-synonyms table instead
      const result = await db
        .insert(occupationSynonyms)
        .values({
          occupationId: parseInt(occupationId),
          synonymId: parseInt(synonymId),
        })
        .returning();

      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating synonym relationship:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/synonym-relationships/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSynonymRelationship(id);

      if (!deleted) {
        return res.status(404).json({ message: "Relationship not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting synonym relationship:", error);
      res.status(500).json({ message: "Failed to delete relationship" });
    }
  });

  // Get synonyms for a specific occupation
  app.get("/api/occupations/:id/synonyms", async (req, res) => {
    try {
      const occupationId = parseInt(req.params.id);

      if (isNaN(occupationId)) {
        return res.status(400).json({ message: "Invalid occupation ID" });
      }

      const occupationSynonymsData = await db
        .select({
          id: synonyms.id,
          title: synonyms.title,
          titleOrig: synonyms.titleOrig,
          language: synonyms.language,
          createdAt: synonyms.createdAt,
          updatedAt: synonyms.updatedAt,
        })
        .from(occupationSynonyms)
        .innerJoin(synonyms, eq(occupationSynonyms.synonymId, synonyms.id))
        .where(eq(occupationSynonyms.occupationId, occupationId));

      res.json(occupationSynonymsData);
    } catch (error) {
      console.error("Error fetching occupation synonyms:", error);
      res.status(500).json({ message: "Failed to fetch synonyms" });
    }
  });

  // Occupation Synonyms
  app.post("/api/occupation-synonyms", async (req, res) => {
    try {
      const { occupationId, synonymId } = req.body;

      if (!occupationId || !synonymId) {
        return res
          .status(400)
          .json({ message: "occupationId and synonymId are required" });
      }

      // Validate that the IDs are valid integers
      const occupationIdInt = parseInt(occupationId);
      const synonymIdInt = parseInt(synonymId);

      if (isNaN(occupationIdInt) || isNaN(synonymIdInt)) {
        return res
          .status(400)
          .json({ message: "Invalid occupationId or synonymId" });
      }

      console.log("Creating occupation synonym relationship:", {
        occupationIdInt,
        synonymIdInt,
      });

      // Simple insert into the occupation_synonyms table
      const result = await db
        .insert(occupationSynonyms)
        .values({
          occupationId: occupationIdInt,
          synonymId: synonymIdInt,
        })
        .returning();

      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating occupation synonym relationship:", error);
      console.error("Request body:", req.body);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Delete occupation synonym relationship
  app.delete("/api/occupation-synonyms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const result = await db
        .delete(occupationSynonyms)
        .where(eq(occupationSynonyms.id, id))
        .returning();

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "Occupation synonym relationship not found" });
      }

      res.json({
        message: "Occupation synonym relationship deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting occupation synonym relationship:", error);
      res.status(500).json({ message: "Failed to delete relationship" });
    }
  });

  // Create occupation source mapping
  app.post("/api/occupation-source-mappings", async (req, res) => {
    try {
      const validatedData = insertOccupationSourceMappingSchema.parse(req.body);

      const result = await db
        .insert(occupationSourceMapping)
        .values(validatedData)
        .returning();

      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating occupation source mapping:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Get occupation synonyms by query params
  app.get("/api/occupation-synonyms", async (req, res) => {
    try {
      const { occupationId, synonymId } = req.query;

      let query = db.select().from(occupationSynonyms);
      
      if (occupationId && synonymId) {
        query = query.where(
          and(
            eq(occupationSynonyms.occupationId, parseInt(occupationId as string)),
            eq(occupationSynonyms.synonymId, parseInt(synonymId as string))
          )
        );
      } else if (occupationId) {
        query = query.where(
          eq(occupationSynonyms.occupationId, parseInt(occupationId as string))
        );
      } else if (synonymId) {
        query = query.where(
          eq(occupationSynonyms.synonymId, parseInt(synonymId as string))
        );
      }

      const results = await query;
      res.json(results);
    } catch (error) {
      console.error("Error fetching occupation synonyms:", error);
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  // Tree structure - get root level nodes (groups without parents)
  app.get("/api/tree/roots", async (req, res) => {
    try {
      const rootGroups = await storage.getRootTaxonomyGroups();
      res.json(rootGroups);
    } catch (error) {
      console.error("Error fetching root taxonomy groups:", error);
      res.status(500).json({ message: "Failed to fetch root groups" });
    }
  });

  // Tree structure - get children of a specific node
  app.get("/api/tree/children/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const children = await storage.getChildrenByEntity(
        entityType,
        parseInt(entityId),
      );
      res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  // Taxonomy Relationships
  app.post("/api/taxonomy-relationships", async (req, res) => {
    try {
      const validatedData = insertTaxonomyRelationshipSchema.parse(req.body);

      // Enforce relationship rules: only "group contains occupation" is allowed
      // This means we should allow:
      // 1. esco_group -> occupation (contains)
      // 2. occupation -> esco_group (contained_by)
      //
      // But prevent:
      // 1. occupation -> esco_group (contains) - occupations cannot contain groups
      // 2. esco_group -> occupation (contained_by) - groups cannot be contained by occupations

      if (
        validatedData.sourceEntityType === "occupation" &&
        validatedData.targetEntityType === "esco_group" &&
        validatedData.relationshipType === "contains"
      ) {
        return res.status(400).json({
          message: "Invalid relationship: occupations cannot contain groups",
        });
      }

      if (
        validatedData.sourceEntityType === "esco_group" &&
        validatedData.targetEntityType === "occupation" &&
        validatedData.relationshipType === "contained_by"
      ) {
        return res.status(400).json({
          message:
            "Invalid relationship: groups cannot be contained by occupations",
        });
      }

      // Check for existing parent relationships when creating a "contains" relationship with an occupation as target
      if (
        validatedData.targetEntityType === "occupation" &&
        validatedData.relationshipType === "contains"
      ) {
        const existingParentCheck = await db.execute(sql`
          SELECT *
          FROM taxonomy_relationships
          WHERE target_entity_type = 'occupation'
            AND target_entity_id = ${validatedData.targetEntityId}
            AND relationship_type = 'contains'
        `);

        if (existingParentCheck.rows.length > 0) {
          return res.status(400).json({
            message:
              "This occupation is already linked to a parent. Please remove the existing relationship before assigning a new one.",
          });
        }
      }

      const relationship =
        await storage.createTaxonomyRelationship(validatedData);
      res.status(201).json(relationship);
    } catch (error) {
      console.error("Error creating taxonomy relationship:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Occupation Taxonomy Mappings
  app.post("/api/occupation-taxonomy-mappings", async (req, res) => {
    try {
      const validatedData = insertOccupationTaxonomyMappingSchema.parse(
        req.body,
      );
      const mapping =
        await storage.createOccupationTaxonomyMapping(validatedData);
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error creating occupation taxonomy mapping:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Audit Log endpoints
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const {
        tableName,
        operation,
        userId,
        recordId,
        dateFrom,
        dateTo,
        page = "1",
        limit = "50",
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build conditions
      const conditions = [];
      
      if (tableName && tableName !== "") {
        conditions.push(eq(auditLog.tableName, tableName as string));
      }
      
      if (operation && operation !== "") {
        conditions.push(eq(auditLog.operation, operation as string));
      }
      
      if (userId && userId !== "") {
        conditions.push(eq(auditLog.userId, userId as string));
      }
      
      if (recordId && recordId !== "") {
        conditions.push(eq(auditLog.recordId, recordId as string));
      }
      
      if (dateFrom) {
        conditions.push(sql`${auditLog.timestamp} >= ${dateFrom}`);
      }
      
      if (dateTo) {
        conditions.push(sql`${auditLog.timestamp} <= ${dateTo}`);
      }

      // Build base query
      let query = db.select().from(auditLog);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(auditLog);

      // Apply conditions
      if (conditions.length > 0) {
        const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
        query = query.where(whereClause);
        countQuery = countQuery.where(whereClause);
      }

      // Apply pagination and ordering
      query = query
        .orderBy(sql`${auditLog.timestamp} DESC`)
        .limit(limitNum)
        .offset(offset);

      // Execute queries
      const [data, countResult] = await Promise.all([query, countQuery]);
      const total = countResult[0]?.count || 0;

      res.json({
        data,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get audit log statistics
  app.get("/api/audit-logs/stats", async (req, res) => {
    try {
      // Get counts by table
      const tableStats = await db
        .select({
          tableName: auditLog.tableName,
          count: sql<number>`count(*)`
        })
        .from(auditLog)
        .groupBy(auditLog.tableName)
        .orderBy(sql`count(*) DESC`);

      // Get counts by operation
      const operationStats = await db
        .select({
          operation: auditLog.operation,
          count: sql<number>`count(*)`
        })
        .from(auditLog)
        .groupBy(auditLog.operation);

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentActivity = await db
        .select({
          date: sql<string>`DATE(${auditLog.timestamp})`,
          count: sql<number>`count(*)`
        })
        .from(auditLog)
        .where(sql`${auditLog.timestamp} >= ${sevenDaysAgo}`)
        .groupBy(sql`DATE(${auditLog.timestamp})`)
        .orderBy(sql`DATE(${auditLog.timestamp})`);

      // Get total count
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLog);

      res.json({
        total: totalResult.count,
        byTable: tableStats,
        byOperation: operationStats,
        recentActivity,
      });
    } catch (error) {
      console.error("Error fetching audit log stats:", error);
      res.status(500).json({ message: "Failed to fetch audit log statistics" });
    }
  });

  // Get audit log for specific record
  app.get("/api/audit-logs/record/:tableName/:recordId", async (req, res) => {
    try {
      const { tableName, recordId } = req.params;
      
      const logs = await db
        .select()
        .from(auditLog)
        .where(
          and(
            eq(auditLog.tableName, tableName),
            eq(auditLog.recordId, recordId)
          )
        )
        .orderBy(sql`${auditLog.timestamp} DESC`);

      res.json(logs);
    } catch (error) {
      console.error("Error fetching record audit logs:", error);
      res.status(500).json({ message: "Failed to fetch record audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
