var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import bcrypt from "bcryptjs";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertOccupationSchema: () => insertOccupationSchema,
  insertOccupationSourceMappingSchema: () => insertOccupationSourceMappingSchema,
  insertOccupationSynonymSchema: () => insertOccupationSynonymSchema,
  insertOccupationTaxonomyMappingSchema: () => insertOccupationTaxonomyMappingSchema,
  insertSynonymRelationshipSchema: () => insertSynonymRelationshipSchema,
  insertSynonymSchema: () => insertSynonymSchema,
  insertSynonymSourceMappingSchema: () => insertSynonymSourceMappingSchema,
  insertTaxonomyGroupSchema: () => insertTaxonomyGroupSchema,
  insertTaxonomyRelationshipSchema: () => insertTaxonomyRelationshipSchema,
  insertTaxonomySourceSchema: () => insertTaxonomySourceSchema,
  insertUserSchema: () => insertUserSchema,
  occupationSourceMapping: () => occupationSourceMapping,
  occupationSynonyms: () => occupationSynonyms,
  occupationTaxonomyMapping: () => occupationTaxonomyMapping,
  occupationTaxonomyMappingRelations: () => occupationTaxonomyMappingRelations,
  occupations: () => occupations,
  occupationsRelations: () => occupationsRelations,
  synonymRelationships: () => synonymRelationships,
  synonymRelationshipsRelations: () => synonymRelationshipsRelations,
  synonymSourceMapping: () => synonymSourceMapping,
  synonymSourceMappingRelations: () => synonymSourceMappingRelations,
  synonyms: () => synonyms,
  synonymsRelations: () => synonymsRelations,
  taxonomyGroups: () => taxonomyGroups,
  taxonomyGroupsRelations: () => taxonomyGroupsRelations,
  taxonomyRelationships: () => taxonomyRelationships,
  taxonomySources: () => taxonomySources,
  taxonomySourcesRelations: () => taxonomySourcesRelations,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var taxonomySources = pgTable("taxonomy_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var synonyms = pgTable("synonyms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  language: varchar("language", { length: 2 }).notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  titleOrig: text("title_orig")
});
var synonymSourceMapping = pgTable("synonym_source_mapping", {
  id: serial("id").primaryKey(),
  synonymId: integer("synonym_id").notNull().references(() => synonyms.id),
  sourceId: integer("source_id").notNull().references(() => taxonomySources.id),
  isVerified: boolean("is_verified").default(false),
  verificationMethod: text("verification_method"),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).default("0.00"),
  isModerated: boolean("is_moderated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  gstId: text("gst_id")
});
var occupations = pgTable("occupations", {
  id: serial("id").primaryKey(),
  escoCode: text("esco_code"),
  uri: text("uri"),
  scopeNote: text("scope_note"),
  preferredLabelEn: text("preferred_label_en").notNull(),
  preferredLabelAr: text("preferred_label_ar"),
  definition: text("definition"),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  gstId: text("gst_id"),
  isGenericTitle: boolean("is_generic_title").default(false),
  minCareerLevel: integer("min_career_level"),
  maxCareerLevel: integer("max_career_level")
});
var taxonomyGroups = pgTable("taxonomy_groups", {
  id: serial("id").primaryKey(),
  escoCode: text("esco_code"),
  preferredLabelEn: text("preferred_label_en").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  altLabels: text("alt_labels"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var taxonomyRelationships = pgTable("taxonomy_relationships", {
  relationshipId: serial("relationship_id").primaryKey(),
  sourceEntityType: text("source_entity_type").notNull(),
  sourceEntityId: integer("source_entity_id").notNull(),
  targetEntityType: text("target_entity_type").notNull(),
  targetEntityId: integer("target_entity_id").notNull(),
  relationshipType: text("relationship_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var occupationSynonyms = pgTable("occupation_synonyms", {
  id: serial("id").primaryKey(),
  occupationId: integer("occupation_id").notNull().references(() => occupations.id),
  synonymId: integer("synonym_id").notNull().references(() => synonyms.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var synonymRelationships = pgTable("synonym_relationships", {
  id: serial("id").primaryKey(),
  synonymId: integer("synonym_id").notNull().references(() => synonyms.id),
  occupationId: integer("occupation_id").notNull().references(() => occupations.id),
  relationshipType: text("relationship_type").default("synonym"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("1.00"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var occupationSourceMapping = pgTable("occupation_source_mapping", {
  id: serial("id").primaryKey(),
  occupationId: integer("occupation_id").notNull().references(() => occupations.id),
  sourceId: integer("source_id").notNull().references(() => taxonomySources.id),
  isVerified: boolean("is_verified").default(false),
  verificationMethod: varchar("verification_method", { length: 255 }),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).default("0.00"),
  isModerated: boolean("is_moderated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var occupationTaxonomyMapping = pgTable("occupation_taxonomy_mapping", {
  id: serial("id").primaryKey(),
  occupationId: integer("occupation_id").notNull().references(() => occupations.id),
  taxonomyId: integer("taxonomy_id").notNull().references(() => taxonomyGroups.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var synonymsRelations = relations(synonyms, ({ many }) => ({
  sourceMappings: many(synonymSourceMapping),
  synonymRelationships: many(synonymRelationships)
}));
var taxonomySourcesRelations = relations(taxonomySources, ({ many }) => ({
  sourceMappings: many(synonymSourceMapping)
}));
var synonymSourceMappingRelations = relations(synonymSourceMapping, ({ one }) => ({
  synonym: one(synonyms, {
    fields: [synonymSourceMapping.synonymId],
    references: [synonyms.id]
  }),
  source: one(taxonomySources, {
    fields: [synonymSourceMapping.sourceId],
    references: [taxonomySources.id]
  })
}));
var occupationsRelations = relations(occupations, ({ many }) => ({
  synonymRelationships: many(synonymRelationships),
  taxonomyMappings: many(occupationTaxonomyMapping)
}));
var taxonomyGroupsRelations = relations(taxonomyGroups, ({ many }) => ({
  occupationMappings: many(occupationTaxonomyMapping)
}));
var synonymRelationshipsRelations = relations(synonymRelationships, ({ one }) => ({
  synonym: one(synonyms, {
    fields: [synonymRelationships.synonymId],
    references: [synonyms.id]
  }),
  occupation: one(occupations, {
    fields: [synonymRelationships.occupationId],
    references: [occupations.id]
  })
}));
var occupationTaxonomyMappingRelations = relations(occupationTaxonomyMapping, ({ one }) => ({
  occupation: one(occupations, {
    fields: [occupationTaxonomyMapping.occupationId],
    references: [occupations.id]
  }),
  taxonomy: one(taxonomyGroups, {
    fields: [occupationTaxonomyMapping.taxonomyId],
    references: [taxonomyGroups.id]
  })
}));
var insertTaxonomySourceSchema = createInsertSchema(taxonomySources).omit({
  id: true,
  createdAt: true
});
var insertSynonymSchema = createInsertSchema(synonyms).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertSynonymSourceMappingSchema = createInsertSchema(synonymSourceMapping).omit({
  id: true,
  createdAt: true
});
var insertOccupationSchema = createInsertSchema(occupations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTaxonomyGroupSchema = createInsertSchema(taxonomyGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTaxonomyRelationshipSchema = createInsertSchema(taxonomyRelationships).omit({
  relationshipId: true,
  createdAt: true
});
var insertSynonymRelationshipSchema = createInsertSchema(synonymRelationships).omit({
  id: true,
  createdAt: true
});
var insertOccupationSynonymSchema = createInsertSchema(occupationSynonyms).omit({
  id: true,
  createdAt: true
});
var insertOccupationTaxonomyMappingSchema = createInsertSchema(occupationTaxonomyMapping).omit({
  id: true,
  createdAt: true
});
var insertOccupationSourceMappingSchema = createInsertSchema(occupationSourceMapping).omit({
  id: true,
  createdAt: true
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";

// server/logger.ts
import fs from "fs";
import path from "path";
var logFile = path.join(process.cwd(), "db-queries.log");
function logQuery(query, params, duration) {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
  const logEntry = {
    timestamp: timestamp2,
    query: query.replace(/\s+/g, " ").trim(),
    params: params || [],
    duration: duration ? `${duration}ms` : void 0
  };
  const logLine = `${timestamp2} - ${JSON.stringify(logEntry)}
`;
  try {
    fs.appendFileSync(logFile, logLine);
  } catch (error) {
    console.error("Failed to write to query log:", error);
  }
}

// server/db.ts
import dotenv from "dotenv";
import path2 from "path";
dotenv.config({ path: path2.join(process.cwd(), "server", ".env") });
console.log("DATABASE_URL", process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var db = drizzle({
  connection: process.env.DATABASE_URL,
  schema: schema_exports,
  logger: {
    logQuery: (query, params) => {
      logQuery(query, params);
    }
  }
});

// server/storage.ts
import {
  eq,
  ilike,
  desc,
  asc,
  sql,
  and,
  or,
  count,
  notExists,
  exists
} from "drizzle-orm";
var DatabaseStorage = class {
  // Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  // Taxonomy Sources
  async getTaxonomySources() {
    return await db.select().from(taxonomySources).orderBy(asc(taxonomySources.name));
  }
  async getTaxonomySource(id) {
    const [source] = await db.select().from(taxonomySources).where(eq(taxonomySources.id, id));
    return source || void 0;
  }
  async createTaxonomySource(source) {
    const [created] = await db.insert(taxonomySources).values(source).returning();
    return created;
  }
  async updateTaxonomySource(id, source) {
    const [updated] = await db.update(taxonomySources).set(source).where(eq(taxonomySources.id, id)).returning();
    return updated || void 0;
  }
  async deleteTaxonomySource(id) {
    const result = await db.delete(taxonomySources).where(eq(taxonomySources.id, id));
    return result.rowCount > 0;
  }
  // Synonyms
  async getSynonyms(params = {}) {
    const {
      search,
      language,
      sourceId,
      withoutSource,
      limit = 50,
      offset = 0
    } = params;
    if (sourceId) {
      let query = db.select({
        id: synonyms.id,
        title: synonyms.title,
        titleOrig: synonyms.titleOrig,
        language: synonyms.language,
        createdAt: synonyms.createdAt,
        updatedAt: synonyms.updatedAt,
        sourceName: taxonomySources.name,
        sourceId: synonymSourceMapping.sourceId
      }).from(synonyms).innerJoin(
        synonymSourceMapping,
        eq(synonyms.id, synonymSourceMapping.synonymId)
      ).innerJoin(
        taxonomySources,
        eq(synonymSourceMapping.sourceId, taxonomySources.id)
      ).where(eq(synonymSourceMapping.sourceId, sourceId));
      let countQuery = db.select({ count: count() }).from(synonyms).innerJoin(
        synonymSourceMapping,
        eq(synonyms.id, synonymSourceMapping.synonymId)
      ).where(eq(synonymSourceMapping.sourceId, sourceId));
      const conditions = [eq(synonymSourceMapping.sourceId, sourceId)];
      if (search) {
        conditions.push(ilike(synonyms.title, `%${search}%`));
      }
      if (language) {
        conditions.push(eq(synonyms.language, language));
      }
      if (conditions.length > 1) {
        query = query.where(and(...conditions));
        countQuery = countQuery.where(and(...conditions));
      }
      query = query.orderBy(desc(synonyms.createdAt)).limit(limit).offset(offset);
      const [data, countResult] = await Promise.all([query, countQuery]);
      return {
        data,
        total: countResult[0]?.count || 0
      };
    } else if (withoutSource) {
      const conditions = [
        notExists(
          db.select().from(synonymSourceMapping).where(eq(synonymSourceMapping.synonymId, synonyms.id))
        )
      ];
      if (search) {
        conditions.push(ilike(synonyms.title, `%${search}%`));
      }
      if (language) {
        conditions.push(eq(synonyms.language, language));
      }
      let query = db.select({
        id: synonyms.id,
        title: synonyms.title,
        titleOrig: synonyms.titleOrig,
        language: synonyms.language,
        createdAt: synonyms.createdAt,
        updatedAt: synonyms.updatedAt,
        sourceName: sql`NULL`.as("sourceName"),
        sourceId: sql`NULL`.as("sourceId")
      }).from(synonyms).where(and(...conditions)).orderBy(desc(synonyms.createdAt)).limit(limit).offset(offset);
      let countQuery = db.select({ count: count() }).from(synonyms).where(and(...conditions));
      const [data, countResult] = await Promise.all([query, countQuery]);
      return {
        data,
        total: countResult[0]?.count || 0
      };
    } else {
      let query = db.select({
        id: synonyms.id,
        title: synonyms.title,
        titleOrig: synonyms.titleOrig,
        language: synonyms.language,
        createdAt: synonyms.createdAt,
        updatedAt: synonyms.updatedAt,
        sourceName: taxonomySources.name,
        sourceId: synonymSourceMapping.sourceId
      }).from(synonyms).leftJoin(
        synonymSourceMapping,
        eq(synonyms.id, synonymSourceMapping.synonymId)
      ).leftJoin(
        taxonomySources,
        eq(synonymSourceMapping.sourceId, taxonomySources.id)
      );
      let countQuery = db.select({ count: count() }).from(synonyms);
      const conditions = [];
      if (search) {
        conditions.push(ilike(synonyms.title, `%${search}%`));
      }
      if (language) {
        conditions.push(eq(synonyms.language, language));
      }
      if (conditions.length > 0) {
        const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
        query = query.where(whereClause);
        countQuery = countQuery.where(whereClause);
      }
      const [data, totalResult] = await Promise.all([
        query.orderBy(desc(synonyms.createdAt)).limit(limit).offset(offset),
        countQuery
      ]);
      return {
        data,
        total: totalResult[0].count
      };
    }
  }
  async getSynonym(id) {
    const [synonym] = await db.select({
      id: synonyms.id,
      title: synonyms.title,
      titleOrig: synonyms.titleOrig,
      language: synonyms.language,
      createdAt: synonyms.createdAt,
      updatedAt: synonyms.updatedAt,
      sourceId: synonymSourceMapping.sourceId,
      sourceName: taxonomySources.name
    }).from(synonyms).leftJoin(
      synonymSourceMapping,
      eq(synonyms.id, synonymSourceMapping.synonymId)
    ).leftJoin(
      taxonomySources,
      eq(synonymSourceMapping.sourceId, taxonomySources.id)
    ).where(eq(synonyms.id, id));
    return synonym || void 0;
  }
  async createSynonym(synonym) {
    const [created] = await db.insert(synonyms).values(synonym).returning();
    return created;
  }
  async updateSynonym(id, synonym) {
    return await db.transaction(async (tx) => {
      const { sourceId, ...synonymData } = synonym;
      const [updated] = await tx.update(synonyms).set({ ...synonymData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(synonyms.id, id)).returning();
      if (!updated) {
        return void 0;
      }
      if ("sourceId" in synonym) {
        await tx.delete(synonymSourceMapping).where(eq(synonymSourceMapping.synonymId, id));
        if (sourceId !== null && sourceId !== void 0) {
          await tx.insert(synonymSourceMapping).values({
            synonymId: id,
            sourceId
          });
        }
      }
      return updated;
    });
  }
  async deleteSynonym(id) {
    return await db.transaction(async (tx) => {
      await tx.delete(occupationSynonyms).where(eq(occupationSynonyms.synonymId, id));
      await tx.delete(synonymSourceMapping).where(eq(synonymSourceMapping.synonymId, id));
      const result = await tx.delete(synonyms).where(eq(synonyms.id, id));
      return (result.rowCount ?? 0) > 0;
    });
  }
  // Synonym Source Mappings
  async getSynonymSourceMappings(synonymId) {
    let query = db.select().from(synonymSourceMapping);
    if (synonymId) {
      query = query.where(eq(synonymSourceMapping.synonymId, synonymId));
    }
    return await query.orderBy(desc(synonymSourceMapping.createdAt));
  }
  async createSynonymSourceMapping(mapping) {
    const [created] = await db.insert(synonymSourceMapping).values(mapping).returning();
    return created;
  }
  async deleteSynonymSourceMapping(id) {
    const result = await db.delete(synonymSourceMapping).where(eq(synonymSourceMapping.id, id));
    return result.rowCount > 0;
  }
  async getOccupations(params = {}) {
    const {
      search,
      escoLevel,
      careerLevel,
      language,
      sourceId,
      withoutSource,
      limit = 50,
      offset = 0,
      unlinked = false
    } = params;
    let query = db.select({
      id: occupations.id,
      createdAt: occupations.createdAt,
      updatedAt: occupations.updatedAt,
      gstId: occupations.gstId,
      escoCode: occupations.escoCode,
      uri: occupations.uri,
      scopeNote: occupations.scopeNote,
      preferredLabelEn: occupations.preferredLabelEn,
      preferredLabelAr: occupations.preferredLabelAr,
      definition: occupations.definition,
      descriptionAr: occupations.descriptionAr,
      descriptionEn: occupations.descriptionEn,
      isGenericTitle: occupations.isGenericTitle,
      minCareerLevel: occupations.minCareerLevel,
      maxCareerLevel: occupations.maxCareerLevel,
      sourceName: taxonomySources.name
    }).from(occupations).leftJoin(occupationSourceMapping, eq(occupations.id, occupationSourceMapping.occupationId)).leftJoin(taxonomySources, eq(occupationSourceMapping.sourceId, taxonomySources.id));
    let countQuery = db.select({ count: count() }).from(occupations).leftJoin(occupationSourceMapping, eq(occupations.id, occupationSourceMapping.occupationId)).leftJoin(taxonomySources, eq(occupationSourceMapping.sourceId, taxonomySources.id));
    const conditions = [];
    if (search) {
      if (language === "ar") {
        conditions.push(
          or(
            ilike(occupations.preferredLabelAr, `%${search}%`),
            ilike(occupations.descriptionAr, `%${search}%`)
          )
        );
      } else {
        conditions.push(
          or(
            ilike(occupations.preferredLabelEn, `%${search}%`),
            ilike(occupations.descriptionEn, `%${search}%`),
            ilike(occupations.escoCode, `%${search}%`)
          )
        );
      }
    }
    if (careerLevel) {
      const level = parseInt(careerLevel);
      conditions.push(
        or(
          eq(occupations.minCareerLevel, level),
          eq(occupations.maxCareerLevel, level)
        )
      );
    }
    if (unlinked) {
      conditions.push(
        notExists(
          db.select().from(taxonomyRelationships).where(
            or(
              and(
                eq(taxonomyRelationships.sourceEntityType, "occupation"),
                eq(taxonomyRelationships.sourceEntityId, occupations.id)
              ),
              and(
                eq(taxonomyRelationships.targetEntityType, "occupation"),
                eq(taxonomyRelationships.targetEntityId, occupations.id)
              )
            )
          )
        )
      );
    }
    if (sourceId) {
      conditions.push(
        exists(
          db.select().from(occupationSourceMapping).where(
            and(
              eq(occupationSourceMapping.occupationId, occupations.id),
              eq(occupationSourceMapping.sourceId, sourceId)
            )
          )
        )
      );
    }
    if (withoutSource) {
      conditions.push(
        notExists(
          db.select().from(occupationSourceMapping).where(eq(occupationSourceMapping.occupationId, occupations.id))
        )
      );
    }
    if (conditions.length > 0) {
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }
    const [data, totalResult] = await Promise.all([
      query.orderBy(desc(occupations.createdAt)).limit(limit).offset(offset),
      countQuery
    ]);
    return {
      data,
      total: totalResult[0].count
    };
  }
  async getOccupation(id) {
    const [occupation] = await db.select().from(occupations).where(eq(occupations.id, id));
    return occupation || void 0;
  }
  async createOccupation(occupation) {
    const [created] = await db.insert(occupations).values(occupation).returning();
    return created;
  }
  async updateOccupation(id, occupation) {
    return await db.transaction(async (tx) => {
      const { sourceId, ...occupationData } = occupation;
      const [updated] = await tx.update(occupations).set({ ...occupationData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(occupations.id, id)).returning();
      if (!updated) {
        return void 0;
      }
      if ("sourceId" in occupation) {
        await tx.delete(occupationSourceMapping).where(eq(occupationSourceMapping.occupationId, id));
        if (sourceId !== null && sourceId !== void 0) {
          await tx.insert(occupationSourceMapping).values({
            occupationId: id,
            sourceId
          });
        }
      }
      return updated;
    });
  }
  async deleteOccupation(id) {
    return await db.transaction(async (tx) => {
      await tx.delete(taxonomyRelationships).where(
        or(
          and(
            eq(taxonomyRelationships.sourceEntityType, "occupation"),
            eq(taxonomyRelationships.sourceEntityId, id)
          ),
          and(
            eq(taxonomyRelationships.targetEntityType, "occupation"),
            eq(taxonomyRelationships.targetEntityId, id)
          )
        )
      );
      await tx.delete(occupationSynonyms).where(eq(occupationSynonyms.occupationId, id));
      const result = await tx.delete(occupations).where(eq(occupations.id, id));
      return (result.rowCount || 0) > 0;
    });
  }
  // Taxonomy Groups
  async getTaxonomyGroups(params = {}) {
    const { search, level, parentId } = params;
    let query = db.select().from(taxonomyGroups);
    const conditions = [];
    if (search) {
      query = query.where(
        ilike(taxonomyGroups.preferredLabelEn, `%${search}%`)
      );
    }
    return await query.orderBy(asc(taxonomyGroups.preferredLabelEn));
  }
  async getTaxonomyGroup(id) {
    const [group] = await db.select().from(taxonomyGroups).where(eq(taxonomyGroups.id, id));
    return group || void 0;
  }
  async getTaxonomyGroupByEscoCode(escoCode) {
    const [group] = await db.select().from(taxonomyGroups).where(eq(taxonomyGroups.escoCode, escoCode));
    return group || void 0;
  }
  async createTaxonomyGroup(group) {
    const [created] = await db.insert(taxonomyGroups).values(group).returning();
    return created;
  }
  async updateTaxonomyGroup(id, group) {
    const [updated] = await db.update(taxonomyGroups).set({ ...group, updatedAt: /* @__PURE__ */ new Date() }).where(eq(taxonomyGroups.id, id)).returning();
    return updated || void 0;
  }
  async deleteTaxonomyGroup(id) {
    const result = await db.delete(taxonomyGroups).where(eq(taxonomyGroups.id, id));
    return result.rowCount > 0;
  }
  async getTaxonomyHierarchy() {
    return await db.select().from(taxonomyGroups).orderBy(asc(taxonomyGroups.preferredLabelEn));
  }
  // Taxonomy Relationships
  async getTaxonomyRelationships(fromGstId) {
    let query = db.select().from(taxonomyRelationships);
    if (fromGstId) {
      query = query.where(
        eq(taxonomyRelationships.sourceEntityId, parseInt(fromGstId))
      );
    }
    return await query.orderBy(desc(taxonomyRelationships.createdAt));
  }
  async createTaxonomyRelationship(relationship) {
    const [created] = await db.insert(taxonomyRelationships).values(relationship).returning();
    return created;
  }
  async deleteTaxonomyRelationship(id) {
    const result = await db.delete(taxonomyRelationships).where(eq(taxonomyRelationships.relationshipId, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Synonym Relationships
  async getSynonymRelationships(occupationId) {
    if (occupationId) {
      const result = await db.select({
        id: synonyms.id,
        title: synonyms.title
      }).from(occupationSynonyms).innerJoin(synonyms, eq(occupationSynonyms.synonymId, synonyms.id)).where(eq(occupationSynonyms.occupationId, occupationId));
      return result;
    }
    return [];
  }
  async createSynonymRelationship(relationship) {
    const [created] = await db.insert(occupationSynonyms).values({
      occupationId: relationship.occupationId,
      synonymId: relationship.synonymId
    }).returning();
    return created;
  }
  async deleteSynonymRelationship(id) {
    const result = await db.delete(occupationSynonyms).where(eq(occupationSynonyms.synonymId, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Occupation Taxonomy Mappings - These tables don't exist in current schema
  async getOccupationTaxonomyMappings(occupationId) {
    return [];
  }
  async createOccupationTaxonomyMapping(mapping) {
    return mapping;
  }
  async deleteOccupationTaxonomyMapping(id) {
    return true;
  }
  // Dashboard Stats
  async getDashboardStats() {
    const [occupationsCount] = await db.select({ count: count() }).from(occupations);
    const [synonymsCount] = await db.select({ count: count() }).from(synonyms);
    return {
      totalOccupations: occupationsCount.count,
      totalSynonyms: synonymsCount.count
    };
  }
  // Source Statistics
  async getOccupationCountPerSource() {
    const result = await db.execute(sql`
      SELECT 
        ts.id as source_id,
        ts.name as source_name,
        COUNT(DISTINCT osm.occupation_id) as occupation_count
      FROM taxonomy_sources ts
      LEFT JOIN occupation_source_mapping osm ON ts.id = osm.source_id
      GROUP BY ts.id, ts.name
      ORDER BY occupation_count DESC, ts.name ASC
    `);
    return result.rows.map((row) => ({
      sourceId: row.source_id,
      sourceName: row.source_name,
      occupationCount: parseInt(row.occupation_count) || 0
    }));
  }
  async getSynonymCountPerSource() {
    const result = await db.execute(sql`
      SELECT 
        ts.id as source_id,
        ts.name as source_name,
        COUNT(DISTINCT ssm.synonym_id) as synonym_count
      FROM taxonomy_sources ts
      LEFT JOIN synonym_source_mapping ssm ON ts.id = ssm.source_id
      GROUP BY ts.id, ts.name
      ORDER BY synonym_count DESC, ts.name ASC
    `);
    return result.rows.map((row) => ({
      sourceId: row.source_id,
      sourceName: row.source_name,
      synonymCount: parseInt(row.synonym_count) || 0
    }));
  }
  // Additional Dashboard Metrics
  async getAverageSynonymsPerOccupation() {
    const result = await db.execute(sql`
      SELECT 
        ROUND(CAST(COUNT(os.synonym_id) AS NUMERIC) / COUNT(DISTINCT os.occupation_id), 2) 
        AS avg_synonyms_per_occupation
      FROM occupation_synonyms os
    `);
    return result.rows.length > 0 ? parseFloat(String(result.rows[0].avg_synonyms_per_occupation)) || 0 : 0;
  }
  async getUnlinkedOccupationCount() {
    const result = await db.execute(sql`
      SELECT COUNT(*) AS unlinked_occupation_count
      FROM occupations o
      WHERE o.id NOT IN (
        SELECT target_entity_id
        FROM taxonomy_relationships
        WHERE target_entity_type = 'occupation'
          AND relationship_type = 'contains'
      )
    `);
    return result.rows.length > 0 ? parseInt(String(result.rows[0].unlinked_occupation_count)) || 0 : 0;
  }
  async getOccupationWithMostSynonyms() {
    const result = await db.execute(sql`
      SELECT 
        o.id AS occupation_id,
        o.preferred_label_en,
        COUNT(os.synonym_id) AS synonym_count
      FROM occupations o
      JOIN occupation_synonyms os ON o.id = os.occupation_id
      GROUP BY o.id, o.preferred_label_en
      ORDER BY synonym_count DESC
      LIMIT 1
    `);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        occupationId: Number(row.occupation_id),
        preferredLabelEn: String(row.preferred_label_en || "Untitled"),
        synonymCount: parseInt(String(row.synonym_count)) || 0
      };
    }
    return null;
  }
  async getOccupationWithFewestSynonyms() {
    const result = await db.execute(sql`
      SELECT 
        o.id AS occupation_id,
        o.preferred_label_en,
        COUNT(os.synonym_id) AS synonym_count
      FROM occupations o
      JOIN occupation_synonyms os ON o.id = os.occupation_id
      GROUP BY o.id, o.preferred_label_en
      HAVING COUNT(os.synonym_id) > 0
      ORDER BY synonym_count ASC
      LIMIT 1
    `);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        occupationId: Number(row.occupation_id),
        preferredLabelEn: String(row.preferred_label_en || "Untitled"),
        synonymCount: parseInt(String(row.synonym_count)) || 0
      };
    }
    return null;
  }
  // Recent Activity Metrics
  async getLastAddedOccupations() {
    const result = await db.execute(sql`
      SELECT id, preferred_label_en, esco_code, created_at
      FROM occupations
      ORDER BY created_at DESC
      LIMIT 3
    `);
    return result.rows.map((row) => ({
      id: Number(row.id),
      preferredLabelEn: row.preferred_label_en || null,
      escoCode: row.esco_code || null,
      createdAt: new Date(row.created_at)
    }));
  }
  async getLastAddedSynonyms() {
    const result = await db.execute(sql`
      SELECT id, title, created_at
      FROM synonyms
      ORDER BY created_at DESC
      LIMIT 3
    `);
    return result.rows.map((row) => ({
      id: Number(row.id),
      title: String(row.title),
      createdAt: new Date(row.created_at)
    }));
  }
  // Data Completeness Metrics
  async getOccupationsWithoutSource() {
    const result = await db.execute(sql`
      SELECT COUNT(*) AS occupations_without_source
      FROM occupations o
      WHERE o.id NOT IN (
        SELECT occupation_id FROM occupation_source_mapping
      )
    `);
    return result.rows.length > 0 ? parseInt(String(result.rows[0].occupations_without_source)) || 0 : 0;
  }
  async getSynonymsWithoutSource() {
    const result = await db.execute(sql`
      SELECT COUNT(*) AS synonyms_without_source
      FROM synonyms s
      WHERE s.id NOT IN (
        SELECT synonym_id FROM synonym_source_mapping
      )
    `);
    return result.rows.length > 0 ? parseInt(String(result.rows[0].synonyms_without_source)) || 0 : 0;
  }
  // Global Search
  async globalSearch(term) {
    const searchTerm = `%${term}%`;
    const [occupationsResult, synonymsResult, taxonomyResult] = await Promise.all([
      db.select().from(occupations).where(
        or(
          ilike(occupations.preferredLabelEn, searchTerm),
          ilike(occupations.preferredLabelAr, searchTerm),
          ilike(occupations.escoCode, searchTerm)
        )
      ).limit(10),
      db.select().from(synonyms).where(ilike(synonyms.title, searchTerm)).limit(10),
      db.select().from(taxonomyGroups).where(ilike(taxonomyGroups.preferredLabelEn, searchTerm)).limit(10)
    ]);
    return {
      occupations: occupationsResult,
      synonyms: synonymsResult,
      taxonomyGroups: taxonomyResult
    };
  }
  // Tree structure methods
  async getRootTaxonomyGroups() {
    const rootGroups = await db.execute(sql`
      SELECT g.id, g.preferred_label_en, g.esco_code, 'esco_group' AS type
      FROM taxonomy_groups g
      WHERE g.id NOT IN (
        SELECT target_entity_id
        FROM taxonomy_relationships
        WHERE target_entity_type = 'esco_group'
          AND relationship_type = 'contains'
      )
      ORDER BY g.preferred_label_en
    `);
    const result = [];
    for (const group of rootGroups.rows) {
      const childCount = await this.getChildrenCount(
        "esco_group",
        Number(group.id)
      );
      result.push({
        id: Number(group.id),
        name: String(group.preferred_label_en) || "Unnamed Group",
        type: "group",
        hasChildren: childCount > 0,
        childCount,
        description: void 0
      });
    }
    return result;
  }
  async getChildrenByEntity(entityType, entityId) {
    const children = await db.execute(sql`
      SELECT 
        tr.source_entity_id AS parent_id,
        tr.source_entity_type AS parent_type,
        tr.target_entity_id AS child_id,
        tr.target_entity_type AS child_type,
        CASE 
          WHEN tr.target_entity_type = 'occupation' THEN o.preferred_label_en
          ELSE g.preferred_label_en
        END AS child_label,
        CASE 
          WHEN tr.target_entity_type = 'occupation' THEN o.esco_code
          ELSE g.esco_code
        END AS child_esco_code
      FROM taxonomy_relationships tr
      LEFT JOIN occupations o ON tr.target_entity_type = 'occupation' AND tr.target_entity_id = o.id
      LEFT JOIN taxonomy_groups g ON tr.target_entity_type = 'esco_group' AND tr.target_entity_id = g.id
      WHERE tr.relationship_type = 'contains'
        AND tr.source_entity_type = ${entityType}
        AND tr.source_entity_id = ${entityId}
        AND (
          (tr.target_entity_type = 'occupation' AND o.id IS NOT NULL) OR
          (tr.target_entity_type = 'esco_group' AND g.id IS NOT NULL)
        )
      ORDER BY child_label
    `);
    const result = [];
    for (const child of children.rows) {
      if (!child.child_label) {
        continue;
      }
      const childType = String(child.child_type);
      const childCount = await this.getChildrenCount(
        childType,
        Number(child.child_id)
      );
      result.push({
        id: Number(child.child_id),
        name: String(child.child_label),
        type: childType === "esco_group" ? "group" : "occupation",
        hasChildren: childCount > 0,
        childCount,
        description: void 0
      });
    }
    return result;
  }
  async getOccupationDetails(id) {
    const occupation = await this.getOccupation(id);
    if (!occupation) {
      return null;
    }
    const parentResult = await db.execute(sql`
      SELECT
        tr.source_entity_type,
        tr.source_entity_id,
        CASE
          WHEN tr.source_entity_type = 'occupation' THEN o.preferred_label_en
          WHEN tr.source_entity_type = 'esco_group' THEN g.preferred_label_en
        END AS parent_label,
        CASE
          WHEN tr.source_entity_type = 'occupation' THEN o.esco_code
          WHEN tr.source_entity_type = 'esco_group' THEN g.esco_code
        END AS parent_code
      FROM taxonomy_relationships tr
      LEFT JOIN occupations o ON tr.source_entity_type = 'occupation' AND tr.source_entity_id = o.id
      LEFT JOIN taxonomy_groups g ON tr.source_entity_type = 'esco_group' AND tr.source_entity_id = g.id
      WHERE tr.target_entity_type = 'occupation'
        AND tr.target_entity_id = ${id}
        AND tr.relationship_type = 'contains'
      LIMIT 1
    `);
    let parent = null;
    if (parentResult.rows.length > 0) {
      const parentRow = parentResult.rows[0];
      parent = {
        type: parentRow.source_entity_type,
        id: parentRow.source_entity_id,
        label: parentRow.parent_label || "Untitled",
        code: parentRow.parent_code || ""
      };
    }
    const childrenResult = await db.execute(sql`
      SELECT
        o.id AS occupation_id,
        o.preferred_label_en,
        o.preferred_label_ar,
        o.esco_code,
        COALESCE(JSON_AGG(DISTINCT s.title) FILTER (WHERE s.title IS NOT NULL), '[]'::json) AS synonyms
      FROM taxonomy_relationships tr
      JOIN occupations o
        ON tr.target_entity_type = 'occupation'
        AND tr.target_entity_id = o.id
      LEFT JOIN occupation_synonyms os
        ON o.id = os.occupation_id
      LEFT JOIN synonyms s
        ON os.synonym_id = s.id
      WHERE tr.source_entity_type = 'occupation'
        AND tr.source_entity_id = ${id}
        AND tr.relationship_type = 'contains'
      GROUP BY o.id, o.preferred_label_en, o.preferred_label_ar, o.esco_code
      ORDER BY o.preferred_label_en
    `);
    const children = childrenResult.rows.map((row) => ({
      id: row.occupation_id,
      preferredLabelEn: row.preferred_label_en || "Untitled",
      preferredLabelAr: row.preferred_label_ar,
      escoCode: row.esco_code,
      synonyms: Array.isArray(row.synonyms) ? row.synonyms.filter(Boolean) : []
    }));
    return {
      occupation,
      parent,
      children
    };
  }
  async getChildrenCount(entityType, entityId) {
    const [result] = await db.select({ count: count() }).from(taxonomyRelationships).where(
      and(
        eq(taxonomyRelationships.sourceEntityType, entityType),
        eq(taxonomyRelationships.sourceEntityId, entityId),
        eq(taxonomyRelationships.relationshipType, "contains")
      )
    );
    return result?.count || 0;
  }
  async mergeOccupations(sourceId, targetId) {
    try {
      if (sourceId === targetId) {
        throw new Error("Cannot merge an occupation with itself");
      }
      const sourceOccupation = await this.getOccupation(sourceId);
      const targetOccupation = await this.getOccupation(targetId);
      if (!sourceOccupation) {
        throw new Error("Source occupation not found");
      }
      if (!targetOccupation) {
        throw new Error("Target occupation not found");
      }
      const circularCheck = await db.execute(sql`
        WITH RECURSIVE descendants AS (
          SELECT 
            tr.target_entity_id
          FROM taxonomy_relationships tr
          WHERE tr.source_entity_type = 'occupation'
            AND tr.source_entity_id = ${sourceId}
            AND tr.relationship_type = 'contains'

          UNION

          SELECT 
            tr.target_entity_id
          FROM taxonomy_relationships tr
          JOIN descendants d ON tr.source_entity_id = d.target_entity_id
          WHERE tr.source_entity_type = 'occupation'
            AND tr.relationship_type = 'contains'
        )
        SELECT *  
        FROM descendants 
        WHERE target_entity_id = ${targetId}
      `);
      if (circularCheck.rows.length > 0) {
        throw new Error(
          "Merge not allowed: The selected target occupation is a descendant of the source occupation. Merging would break the hierarchy."
        );
      }
      await db.execute(sql`BEGIN`);
      try {
        if (sourceOccupation.preferredLabelEn) {
          await db.execute(sql`
            INSERT INTO synonyms (title)
            SELECT DISTINCT ${sourceOccupation.preferredLabelEn}
            WHERE ${sourceOccupation.preferredLabelEn} NOT IN (
              SELECT s.title
              FROM occupation_synonyms os
              JOIN synonyms s ON os.synonym_id = s.id
              WHERE os.occupation_id = ${targetId}
            )
          `);
        }
        if (sourceOccupation.preferredLabelAr) {
          await db.execute(sql`
            INSERT INTO synonyms (title)
            SELECT DISTINCT ${sourceOccupation.preferredLabelAr}
            WHERE ${sourceOccupation.preferredLabelAr} NOT IN (
              SELECT s.title
              FROM occupation_synonyms os
              JOIN synonyms s ON os.synonym_id = s.id
              WHERE os.occupation_id = ${targetId}
            )
          `);
        }
        await db.execute(sql`
          INSERT INTO occupation_synonyms (occupation_id, synonym_id)
          SELECT ${targetId}, s.id
          FROM synonyms s
          WHERE s.title IN (
            SELECT preferred_label_en FROM occupations WHERE id = ${sourceId} AND preferred_label_en IS NOT NULL
            UNION
            SELECT preferred_label_ar FROM occupations WHERE id = ${sourceId} AND preferred_label_ar IS NOT NULL
          )
          AND s.id NOT IN (
            SELECT synonym_id
            FROM occupation_synonyms
            WHERE occupation_id = ${targetId}
          )
        `);
        await db.execute(sql`
          INSERT INTO occupation_synonyms (occupation_id, synonym_id)
          SELECT ${targetId}, synonym_id
          FROM occupation_synonyms
          WHERE occupation_id = ${sourceId}
            AND synonym_id NOT IN (
              SELECT synonym_id
              FROM occupation_synonyms
              WHERE occupation_id = ${targetId}
            )
        `);
        await db.execute(sql`
          DELETE FROM occupation_synonyms WHERE occupation_id = ${sourceId}
        `);
        await db.execute(sql`
          DELETE FROM taxonomy_relationships 
          WHERE (source_entity_type = 'occupation' AND source_entity_id = ${sourceId})
             OR (target_entity_type = 'occupation' AND target_entity_id = ${sourceId})
        `);
        await db.execute(sql`
          DELETE FROM occupations WHERE id = ${sourceId}
        `);
        await db.execute(sql`COMMIT`);
        return true;
      } catch (error) {
        await db.execute(sql`ROLLBACK`);
        throw error;
      }
    } catch (error) {
      console.error("Error merging occupations:", error);
      throw error;
    }
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { eq as eq2, sql as sql2 } from "drizzle-orm";

// server/utils/csv-export.ts
function convertToCSV(data, headers) {
  if (!data.length) return "";
  const csvHeaders = headers || Object.keys(data[0]);
  const headerRow = csvHeaders.map((header) => `"${header}"`).join(",");
  const dataRows = data.map((row) => {
    return csvHeaders.map((header) => {
      const value = row[header];
      const stringValue = value == null ? "" : String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(",");
  });
  return [headerRow, ...dataRows].join("\n");
}
function setCSVDownloadHeaders(res, filename) {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
}

// server/routes.ts
var ADMIN_USERNAME = "panda";
var ADMIN_PASSWORD_HASH = "$2b$10$wdCPSp3BEHXRP64Y817QAO87ud9AJz7CYuCsMhKl8xa1ca1F/PdiS";
async function registerRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      if (username !== ADMIN_USERNAME) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt.compare(
        password,
        ADMIN_PASSWORD_HASH
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
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/dashboard/occupation-count-per-source", async (req, res) => {
    try {
      const stats = await storage.getOccupationCountPerSource();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching occupation count per source:", error);
      res.status(500).json({ message: "Failed to fetch occupation statistics" });
    }
  });
  app2.get("/api/dashboard/synonym-count-per-source", async (req, res) => {
    try {
      const stats = await storage.getSynonymCountPerSource();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching synonym count per source:", error);
      res.status(500).json({ message: "Failed to fetch synonym statistics" });
    }
  });
  app2.get(
    "/api/dashboard/average-synonyms-per-occupation",
    async (req, res) => {
      try {
        const average = await storage.getAverageSynonymsPerOccupation();
        res.json({ averageSynonymsPerOccupation: average });
      } catch (error) {
        console.error("Error fetching average synonyms per occupation:", error);
        res.status(500).json({ message: "Failed to fetch average synonyms statistics" });
      }
    }
  );
  app2.get("/api/dashboard/unlinked-occupations-count", async (req, res) => {
    try {
      const count2 = await storage.getUnlinkedOccupationCount();
      res.json({ unlinkedOccupationCount: count2 });
    } catch (error) {
      console.error("Error fetching unlinked occupations count:", error);
      res.status(500).json({ message: "Failed to fetch unlinked occupations statistics" });
    }
  });
  app2.get("/api/dashboard/occupation-most-synonyms", async (req, res) => {
    try {
      const occupation = await storage.getOccupationWithMostSynonyms();
      res.json(occupation);
    } catch (error) {
      console.error("Error fetching occupation with most synonyms:", error);
      res.status(500).json({ message: "Failed to fetch occupation with most synonyms" });
    }
  });
  app2.get("/api/dashboard/occupation-fewest-synonyms", async (req, res) => {
    try {
      const occupation = await storage.getOccupationWithFewestSynonyms();
      res.json(occupation);
    } catch (error) {
      console.error("Error fetching occupation with fewest synonyms:", error);
      res.status(500).json({ message: "Failed to fetch occupation with fewest synonyms" });
    }
  });
  app2.get("/api/dashboard/last-added-occupations", async (req, res) => {
    try {
      const occupations2 = await storage.getLastAddedOccupations();
      res.json(occupations2);
    } catch (error) {
      console.error("Error fetching last added occupations:", error);
      res.status(500).json({ message: "Failed to fetch recent occupations" });
    }
  });
  app2.get("/api/dashboard/last-added-synonyms", async (req, res) => {
    try {
      const synonyms2 = await storage.getLastAddedSynonyms();
      res.json(synonyms2);
    } catch (error) {
      console.error("Error fetching last added synonyms:", error);
      res.status(500).json({ message: "Failed to fetch recent synonyms" });
    }
  });
  app2.get("/api/dashboard/occupations-without-source", async (req, res) => {
    try {
      const count2 = await storage.getOccupationsWithoutSource();
      res.json({ occupationsWithoutSource: count2 });
    } catch (error) {
      console.error("Error fetching occupations without source:", error);
      res.status(500).json({ message: "Failed to fetch occupations without source count" });
    }
  });
  app2.get("/api/dashboard/synonyms-without-source", async (req, res) => {
    try {
      const count2 = await storage.getSynonymsWithoutSource();
      res.json({ synonymsWithoutSource: count2 });
    } catch (error) {
      console.error("Error fetching synonyms without source:", error);
      res.status(500).json({ message: "Failed to fetch synonyms without source count" });
    }
  });
  app2.get("/api/search", async (req, res) => {
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
  app2.get("/api/taxonomy-sources", async (req, res) => {
    try {
      const sources = await storage.getTaxonomySources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching taxonomy sources:", error);
      res.status(500).json({ message: "Failed to fetch taxonomy sources" });
    }
  });
  app2.post("/api/taxonomy-sources", async (req, res) => {
    try {
      const validatedData = insertTaxonomySourceSchema.parse(req.body);
      const source = await storage.createTaxonomySource(validatedData);
      res.status(201).json(source);
    } catch (error) {
      console.error("Error creating taxonomy source:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  app2.put("/api/taxonomy-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTaxonomySourceSchema.partial().parse(req.body);
      const source = await storage.updateTaxonomySource(id, validatedData);
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }
      res.json(source);
    } catch (error) {
      console.error("Error updating taxonomy source:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  app2.delete("/api/taxonomy-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTaxonomySource(id);
      if (!deleted) {
        return res.status(404).json({ message: "Source not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting taxonomy source:", error);
      res.status(500).json({ message: "Failed to delete source" });
    }
  });
  app2.get("/api/synonyms", async (req, res) => {
    try {
      const {
        search,
        language,
        sourceId: sourceIdParam,
        withoutSource: withoutSourceParam,
        page = "1",
        limit = "50"
      } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      let sourceId;
      if (sourceIdParam && sourceIdParam !== "") {
        sourceId = parseInt(sourceIdParam);
      }
      const withoutSource = withoutSourceParam === "true";
      const result = await storage.getSynonyms({
        search,
        language,
        sourceId,
        withoutSource,
        limit: limitNum,
        offset
      });
      res.json({
        ...result,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum)
      });
    } catch (error) {
      console.error("Error fetching synonyms:", error);
      res.status(500).json({ message: "Failed to fetch synonyms" });
    }
  });
  app2.get("/api/synonyms/:id", async (req, res) => {
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
  app2.post("/api/synonyms", async (req, res) => {
    try {
      if (!req.body.title || req.body.title.trim() === "") {
        return res.status(400).json({ message: "Synonym title is required." });
      }
      req.body.title = req.body.title.trim();
      const validatedData = insertSynonymSchema.parse(req.body);
      const existingSynonym = await db.select().from(synonyms).where(eq2(synonyms.title, validatedData.title)).limit(1);
      if (existingSynonym.length > 0) {
        return res.status(409).json({
          message: `A synonym with the title "${validatedData.title}" already exists`
        });
      }
      const synonym = await storage.createSynonym(validatedData);
      res.status(201).json(synonym);
    } catch (error) {
      console.error("Error creating synonym:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  app2.put("/api/synonyms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.body.title || req.body.title.trim() === "") {
        return res.status(400).json({ message: "Synonym title is required." });
      }
      req.body.title = req.body.title.trim();
      const validatedData = insertSynonymSchema.partial().parse(req.body);
      const synonym = await storage.updateSynonym(id, {
        ...validatedData,
        sourceId: req.body.sourceId ?? null
      });
      if (!synonym) {
        return res.status(404).json({ message: "Synonym not found" });
      }
      res.json(synonym);
    } catch (error) {
      console.error("Error updating synonym:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  app2.delete("/api/synonyms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSynonym(id);
      if (!deleted) {
        return res.status(404).json({ message: "Synonym not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting synonym:", error);
      res.status(500).json({ message: "Failed to delete synonym" });
    }
  });
  app2.get("/api/occupations", async (req, res) => {
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
        unlinked
      } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      let sourceId;
      if (sourceIdParam && sourceIdParam !== "") {
        sourceId = parseInt(sourceIdParam);
      }
      const withoutSource = withoutSourceParam === "true";
      const result = await storage.getOccupations({
        search,
        escoLevel,
        careerLevel,
        language,
        sourceId,
        withoutSource,
        unlinked: unlinked === "true",
        limit: limitNum,
        offset
      });
      res.json({
        ...result,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum)
      });
    } catch (error) {
      console.error("Error fetching occupations:", error);
      res.status(500).json({ message: "Failed to fetch occupations" });
    }
  });
  app2.get("/api/occupations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const occupation = await storage.getOccupation(id);
      if (!occupation) {
        return res.status(404).json({ message: "Occupation not found" });
      }
      const synonymRelationships3 = await storage.getSynonymRelationships(id);
      res.json({
        ...occupation,
        synonyms: synonymRelationships3
      });
    } catch (error) {
      console.error("Error fetching occupation:", error);
      res.status(500).json({ message: "Failed to fetch occupation" });
    }
  });
  app2.get("/api/occupations/:id/details", async (req, res) => {
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
  app2.post("/api/occupations", async (req, res) => {
    try {
      const {
        occupation: occupationData,
        synonyms: synonymData = [],
        parentRelation,
        sourceId
      } = req.body;
      if (!occupationData.preferredLabelEn || occupationData.preferredLabelEn.trim() === "") {
        return res.status(400).json({ message: "Preferred label must not be empty." });
      }
      occupationData.preferredLabelEn = occupationData.preferredLabelEn.trim();
      const validatedOccupation = insertOccupationSchema.parse(occupationData);
      if (validatedOccupation.preferredLabelEn) {
        const existingOccupations = await storage.getOccupations({
          search: validatedOccupation.preferredLabelEn.trim()
        });
        const exactMatch = existingOccupations.data.find(
          (occ) => occ.preferredLabelEn?.toLowerCase() === validatedOccupation.preferredLabelEn?.trim().toLowerCase()
        );
        if (exactMatch) {
          return res.status(400).json({
            message: "An occupation with this English name already exists"
          });
        }
      }
      const result = await db.transaction(async (tx) => {
        const [occupation] = await tx.insert(occupations).values(validatedOccupation).returning();
        const synonymIds = [];
        for (const synonym of synonymData) {
          if (synonym.isNew) {
            const validatedSynonym = insertSynonymSchema.parse({
              title: synonym.title,
              language: synonym.language || "en"
            });
            const [newSynonym] = await tx.insert(synonyms).values(validatedSynonym).returning();
            synonymIds.push(newSynonym.id);
          } else {
            synonymIds.push(synonym.id);
          }
        }
        for (const synonymId of synonymIds) {
          await tx.insert(occupationSynonyms).values({
            occupationId: occupation.id,
            synonymId
          });
        }
        if (parentRelation) {
          const { type, id: parentId } = parentRelation;
          await tx.insert(taxonomyRelationships).values({
            sourceEntityType: type === "occupation" ? "occupation" : "esco_group",
            sourceEntityId: parentId,
            targetEntityType: "occupation",
            targetEntityId: occupation.id,
            relationshipType: "contains"
          });
          await tx.insert(taxonomyRelationships).values({
            sourceEntityType: "occupation",
            sourceEntityId: occupation.id,
            targetEntityType: type === "occupation" ? "occupation" : "esco_group",
            targetEntityId: parentId,
            relationshipType: "contained_by"
          });
        }
        if (sourceId) {
          await tx.insert(occupationSourceMapping).values({
            occupationId: occupation.id,
            sourceId,
            isVerified: false,
            confidenceScore: "1.00",
            isModerated: false
          });
        }
        return occupation;
      });
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating occupation:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  app2.put("/api/occupations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (req.body.preferredLabelEn !== void 0) {
        if (!req.body.preferredLabelEn || req.body.preferredLabelEn.trim() === "") {
          return res.status(400).json({ message: "Preferred label must not be empty." });
        }
        req.body.preferredLabelEn = req.body.preferredLabelEn.trim();
        if (req.body.preferredLabelAr === "") {
          req.body.preferredLabelAr = null;
        }
        const validatedData = insertOccupationSchema.partial().parse(req.body);
        const occupation = await storage.updateOccupation(id, {
          ...validatedData,
          sourceId: req.body.sourceId ?? null
        });
        if (!occupation) {
          return res.status(404).json({ message: "Occupation not found" });
        }
        return res.json(occupation);
      }
      const {
        occupation: occupationData,
        synonyms: synonymData = [],
        parentRelation,
        sourceId
      } = req.body;
      const validatedOccupation = insertOccupationSchema.partial().parse(occupationData);
      const result = await db.transaction(async (tx) => {
        const [occupation] = await tx.update(occupations).set(validatedOccupation).where(eq2(occupations.id, id)).returning();
        if (!occupation) {
          throw new Error("Occupation not found");
        }
        await tx.delete(occupationSynonyms).where(eq2(occupationSynonyms.occupationId, id));
        const synonymIds = [];
        for (const synonym of synonymData) {
          if (synonym.isNew) {
            const validatedSynonym = insertSynonymSchema.parse({
              title: synonym.title,
              language: synonym.language || "en"
            });
            const [newSynonym] = await tx.insert(synonyms).values(validatedSynonym).returning();
            synonymIds.push(newSynonym.id);
          } else {
            synonymIds.push(synonym.id);
          }
        }
        for (const synonymId of synonymIds) {
          await tx.insert(occupationSynonyms).values({
            occupationId: occupation.id,
            synonymId
          });
        }
        await tx.delete(taxonomyRelationships).where(eq2(taxonomyRelationships.sourceEntityId, id));
        await tx.delete(taxonomyRelationships).where(eq2(taxonomyRelationships.targetEntityId, id));
        if (parentRelation) {
          const { type, id: parentId } = parentRelation;
          await tx.insert(taxonomyRelationships).values({
            sourceEntityType: type === "occupation" ? "occupation" : "esco_group",
            sourceEntityId: parentId,
            targetEntityType: "occupation",
            targetEntityId: occupation.id,
            relationshipType: "contains"
          });
          await tx.insert(taxonomyRelationships).values({
            sourceEntityType: "occupation",
            sourceEntityId: occupation.id,
            targetEntityType: type === "occupation" ? "occupation" : "esco_group",
            targetEntityId: parentId,
            relationshipType: "contained_by"
          });
        }
        await tx.delete(occupationSourceMapping).where(eq2(occupationSourceMapping.occupationId, id));
        if (sourceId) {
          await tx.insert(occupationSourceMapping).values({
            occupationId: occupation.id,
            sourceId,
            isVerified: false,
            confidenceScore: "1.00",
            isModerated: false
          });
        }
        return occupation;
      });
      res.json(result);
    } catch (error) {
      console.error("Error updating occupation:", error);
      if (error.message === "Occupation not found") {
        res.status(404).json({ message: "Occupation not found" });
      } else {
        res.status(400).json({ message: "Invalid data" });
      }
    }
  });
  app2.delete("/api/occupations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOccupation(id);
      if (!deleted) {
        return res.status(404).json({ message: "Occupation not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting occupation:", error);
      res.status(500).json({ message: "Failed to delete occupation" });
    }
  });
  app2.get("/api/occupations/:id/synonyms", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const synonymsResult = await db.select({
        id: synonyms.id,
        title: synonyms.title
      }).from(occupationSynonyms).innerJoin(synonyms, eq2(occupationSynonyms.synonymId, synonyms.id)).where(eq2(occupationSynonyms.occupationId, id));
      res.json(synonymsResult);
    } catch (error) {
      console.error("Error fetching occupation synonyms:", error);
      res.status(500).json({ message: "Failed to fetch occupation synonyms" });
    }
  });
  app2.post("/api/occupations/merge", async (req, res) => {
    try {
      const { sourceId, targetId } = req.body;
      if (!sourceId || !targetId) {
        return res.status(400).json({ message: "Source and target occupation IDs are required" });
      }
      if (sourceId === targetId) {
        return res.status(400).json({ message: "Cannot merge an occupation with itself" });
      }
      const success = await storage.mergeOccupations(
        parseInt(sourceId),
        parseInt(targetId)
      );
      if (success) {
        res.json({ message: "Occupations merged successfully" });
      } else {
        res.status(500).json({ message: "Failed to merge occupations" });
      }
    } catch (error) {
      console.error("Error merging occupations:", error);
      res.status(500).json({ message: error.message || "Failed to merge occupations" });
    }
  });
  app2.put("/api/occupations/:id/relationship", async (req, res) => {
    try {
      const occupationId = parseInt(req.params.id);
      const { parentType, parentId } = req.body;
      if (!parentType || !parentId) {
        return res.status(400).json({ message: "Parent type and ID are required" });
      }
      if (!["occupation", "esco_group"].includes(parentType)) {
        return res.status(400).json({
          message: "Parent type must be 'occupation' or 'esco_group'"
        });
      }
      const currentParentQuery = await db.execute(sql2`
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
      if (currentParentQuery.rows.length > 0) {
        const currentParent = currentParentQuery.rows[0];
        const currentParentType = currentParent.source_entity_type;
        const currentParentId = currentParent.source_entity_id;
        const currentParentName = currentParent.parent_name || "Unknown";
        if (currentParentType !== parentType || currentParentId !== parentId) {
          return res.status(400).json({
            message: `This occupation is already linked to parent "${currentParentName}" (${currentParentType} ID: ${currentParentId}). Multiple parents are not allowed. Please remove the existing relationship first if you want to assign a new parent.`
          });
        }
        return res.json({
          message: `Relationship already exists with the specified parent "${currentParentName}" (${currentParentType} ID: ${currentParentId})`
        });
      }
      if (parentType === "occupation") {
        const circularCheck = await db.execute(sql2`
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
          const circularAncestor = circularCheck.rows[0];
          return res.status(400).json({
            message: `Circular relationship detected! The occupation you're trying to assign as parent is actually a descendant of the current occupation. This would create an invalid hierarchy where "${circularAncestor.entity_name || "Unknown"}" would be both ancestor and descendant.`
          });
        }
      }
      if (parentType === "occupation" && parentId === occupationId) {
        return res.status(400).json({
          message: "An occupation cannot be its own parent. Self-reference relationships are not allowed."
        });
      }
      await db.execute(sql2`BEGIN`);
      try {
        await db.execute(sql2`
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
        await db.execute(sql2`
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
        await db.execute(sql2`COMMIT`);
        res.json({ message: "Relationship created successfully" });
      } catch (error) {
        await db.execute(sql2`ROLLBACK`);
        throw error;
      }
    } catch (error) {
      console.error("Error updating occupation relationship:", error);
      res.status(500).json({ message: "Failed to update relationship" });
    }
  });
  app2.get("/api/taxonomy-groups", async (req, res) => {
    try {
      const { search, level, parentId } = req.query;
      const groups = await storage.getTaxonomyGroups({
        search,
        level: level ? parseInt(level) : void 0,
        parentId: parentId ? parseInt(parentId) : void 0
      });
      res.json(groups);
    } catch (error) {
      console.error("Error fetching taxonomy groups:", error);
      res.status(500).json({ message: "Failed to fetch taxonomy groups" });
    }
  });
  app2.get("/api/taxonomy-groups/hierarchy", async (req, res) => {
    try {
      const hierarchy = await storage.getTaxonomyHierarchy();
      res.json(hierarchy);
    } catch (error) {
      console.error("Error fetching taxonomy hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch taxonomy hierarchy" });
    }
  });
  app2.get("/api/taxonomy-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await storage.getTaxonomyGroup(id);
      if (!group) {
        return res.status(404).json({ message: "Taxonomy group not found" });
      }
      const children = await storage.getTaxonomyGroups({ parentId: id });
      res.json({
        ...group,
        children
      });
    } catch (error) {
      console.error("Error fetching taxonomy group:", error);
      res.status(500).json({ message: "Failed to fetch taxonomy group" });
    }
  });
  app2.post("/api/taxonomy-groups", async (req, res) => {
    try {
      const validatedData = insertTaxonomyGroupSchema.parse(req.body);
      const group = await storage.createTaxonomyGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating taxonomy group:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  app2.put("/api/taxonomy-groups/:id", async (req, res) => {
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
  app2.delete("/api/taxonomy-groups/:id", async (req, res) => {
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
  app2.post("/api/synonym-relationships", async (req, res) => {
    try {
      const { synonymId, occupationId } = req.body;
      if (!synonymId || !occupationId) {
        return res.status(400).json({ message: "synonymId and occupationId are required" });
      }
      const result = await db.insert(occupationSynonyms).values({
        occupationId: parseInt(occupationId),
        synonymId: parseInt(synonymId)
      }).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating synonym relationship:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  app2.delete("/api/synonym-relationships/:id", async (req, res) => {
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
  app2.get("/api/occupations/:id/synonyms", async (req, res) => {
    try {
      const occupationId = parseInt(req.params.id);
      if (isNaN(occupationId)) {
        return res.status(400).json({ message: "Invalid occupation ID" });
      }
      const occupationSynonymsData = await db.select({
        id: synonyms.id,
        title: synonyms.title,
        titleOrig: synonyms.titleOrig,
        language: synonyms.language,
        createdAt: synonyms.createdAt,
        updatedAt: synonyms.updatedAt
      }).from(occupationSynonyms).innerJoin(synonyms, eq2(occupationSynonyms.synonymId, synonyms.id)).where(eq2(occupationSynonyms.occupationId, occupationId));
      res.json(occupationSynonymsData);
    } catch (error) {
      console.error("Error fetching occupation synonyms:", error);
      res.status(500).json({ message: "Failed to fetch synonyms" });
    }
  });
  app2.post("/api/occupation-synonyms", async (req, res) => {
    try {
      const { occupationId, synonymId } = req.body;
      if (!occupationId || !synonymId) {
        return res.status(400).json({ message: "occupationId and synonymId are required" });
      }
      const occupationIdInt = parseInt(occupationId);
      const synonymIdInt = parseInt(synonymId);
      if (isNaN(occupationIdInt) || isNaN(synonymIdInt)) {
        return res.status(400).json({ message: "Invalid occupationId or synonymId" });
      }
      console.log("Creating occupation synonym relationship:", {
        occupationIdInt,
        synonymIdInt
      });
      const result = await db.insert(occupationSynonyms).values({
        occupationId: occupationIdInt,
        synonymId: synonymIdInt
      }).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating occupation synonym relationship:", error);
      console.error("Request body:", req.body);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  app2.delete("/api/occupation-synonyms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      const result = await db.delete(occupationSynonyms).where(eq2(occupationSynonyms.id, id)).returning();
      if (result.length === 0) {
        return res.status(404).json({ message: "Occupation synonym relationship not found" });
      }
      res.json({
        message: "Occupation synonym relationship deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting occupation synonym relationship:", error);
      res.status(500).json({ message: "Failed to delete relationship" });
    }
  });
  app2.post("/api/occupation-source-mappings", async (req, res) => {
    try {
      const validatedData = insertOccupationSourceMappingSchema.parse(req.body);
      const result = await db.insert(occupationSourceMapping).values(validatedData).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating occupation source mapping:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  app2.get("/api/occupation-synonyms", async (req, res) => {
    try {
      const { occupationId, synonymId } = req.query;
      let query = db.select().from(occupationSynonyms);
      if (occupationId) {
        query = query.where(
          eq2(occupationSynonyms.occupationId, parseInt(occupationId))
        );
      }
      if (synonymId) {
        query = query.where(
          eq2(occupationSynonyms.synonymId, parseInt(synonymId))
        );
      }
      const results = await query;
      res.json(results);
    } catch (error) {
      console.error("Error fetching occupation synonyms:", error);
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });
  app2.get("/api/tree/roots", async (req, res) => {
    try {
      const rootGroups = await storage.getRootTaxonomyGroups();
      res.json(rootGroups);
    } catch (error) {
      console.error("Error fetching root taxonomy groups:", error);
      res.status(500).json({ message: "Failed to fetch root groups" });
    }
  });
  app2.get("/api/tree/children/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const children = await storage.getChildrenByEntity(
        entityType,
        parseInt(entityId)
      );
      res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });
  app2.post("/api/taxonomy-relationships", async (req, res) => {
    try {
      const validatedData = insertTaxonomyRelationshipSchema.parse(req.body);
      if (validatedData.sourceEntityType === "occupation" && validatedData.targetEntityType === "esco_group" && validatedData.relationshipType === "contains") {
        return res.status(400).json({
          message: "Invalid relationship: occupations cannot contain groups"
        });
      }
      if (validatedData.sourceEntityType === "esco_group" && validatedData.targetEntityType === "occupation" && validatedData.relationshipType === "contained_by") {
        return res.status(400).json({
          message: "Invalid relationship: groups cannot be contained by occupations"
        });
      }
      if (validatedData.targetEntityType === "occupation" && validatedData.relationshipType === "contains") {
        const existingParentCheck = await db.execute(sql2`
          SELECT *
          FROM taxonomy_relationships
          WHERE target_entity_type = 'occupation'
            AND target_entity_id = ${validatedData.targetEntityId}
            AND relationship_type = 'contains'
        `);
        if (existingParentCheck.rows.length > 0) {
          return res.status(400).json({
            message: "This occupation is already linked to a parent. Please remove the existing relationship before assigning a new one."
          });
        }
      }
      const relationship = await storage.createTaxonomyRelationship(validatedData);
      res.status(201).json(relationship);
    } catch (error) {
      console.error("Error creating taxonomy relationship:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  app2.post("/api/occupation-taxonomy-mappings", async (req, res) => {
    try {
      const validatedData = insertOccupationTaxonomyMappingSchema.parse(
        req.body
      );
      const mapping = await storage.createOccupationTaxonomyMapping(validatedData);
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error creating occupation taxonomy mapping:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 4e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
