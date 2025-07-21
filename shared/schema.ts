import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Taxonomy Sources
export const taxonomySources = pgTable("taxonomy_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Synonyms
export const synonyms = pgTable("synonyms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  language: varchar("language", { length: 2 }).notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  titleOrig: text("title_orig"),
});

// Synonym Source Mapping
export const synonymSourceMapping = pgTable("synonym_source_mapping", {
  id: serial("id").primaryKey(),
  synonymId: integer("synonym_id").notNull().references(() => synonyms.id),
  sourceId: integer("source_id").notNull().references(() => taxonomySources.id),
  isVerified: boolean("is_verified").default(false),
  verificationMethod: text("verification_method"),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).default("0.00"),
  isModerated: boolean("is_moderated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  gstId: text("gst_id"),
});

// Occupations
export const occupations = pgTable("occupations", {
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
  maxCareerLevel: integer("max_career_level"),
});

// Taxonomy Groups
export const taxonomyGroups = pgTable("taxonomy_groups", {
  id: serial("id").primaryKey(),
  escoCode: text("esco_code"),
  preferredLabelEn: text("preferred_label_en").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  altLabels: text("alt_labels"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Taxonomy Relationships
export const taxonomyRelationships = pgTable("taxonomy_relationships", {
  relationshipId: serial("relationship_id").primaryKey(),
  sourceEntityType: text("source_entity_type").notNull(),
  sourceEntityId: integer("source_entity_id").notNull(),
  targetEntityType: text("target_entity_type").notNull(),
  targetEntityId: integer("target_entity_id").notNull(),
  relationshipType: text("relationship_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Occupation Synonyms (many-to-many between synonyms and occupations)
export const occupationSynonyms = pgTable("occupation_synonyms", {
  id: serial("id").primaryKey(),
  occupationId: integer("occupation_id").notNull().references(() => occupations.id),
  synonymId: integer("synonym_id").notNull().references(() => synonyms.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Synonym Relationships (many-to-many between synonyms and occupations)
export const synonymRelationships = pgTable("synonym_relationships", {
  id: serial("id").primaryKey(),
  synonymId: integer("synonym_id").notNull().references(() => synonyms.id),
  occupationId: integer("occupation_id").notNull().references(() => occupations.id),
  relationshipType: text("relationship_type").default("synonym"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("1.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Occupation Source Mapping
export const occupationSourceMapping = pgTable("occupation_source_mapping", {
  id: serial("id").primaryKey(),
  occupationId: integer("occupation_id").notNull().references(() => occupations.id),
  sourceId: integer("source_id").notNull().references(() => taxonomySources.id),
  isVerified: boolean("is_verified").default(false),
  verificationMethod: varchar("verification_method", { length: 255 }),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).default("0.00"),
  isModerated: boolean("is_moderated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Occupation Taxonomy Mapping
export const occupationTaxonomyMapping = pgTable("occupation_taxonomy_mapping", {
  id: serial("id").primaryKey(),
  occupationId: integer("occupation_id").notNull().references(() => occupations.id),
  taxonomyId: integer("taxonomy_id").notNull().references(() => taxonomyGroups.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const synonymsRelations = relations(synonyms, ({ many }) => ({
  sourceMappings: many(synonymSourceMapping),
  synonymRelationships: many(synonymRelationships),
}));

export const taxonomySourcesRelations = relations(taxonomySources, ({ many }) => ({
  sourceMappings: many(synonymSourceMapping),
}));

export const synonymSourceMappingRelations = relations(synonymSourceMapping, ({ one }) => ({
  synonym: one(synonyms, {
    fields: [synonymSourceMapping.synonymId],
    references: [synonyms.id],
  }),
  source: one(taxonomySources, {
    fields: [synonymSourceMapping.sourceId],
    references: [taxonomySources.id],
  }),
}));

export const occupationsRelations = relations(occupations, ({ many }) => ({
  synonymRelationships: many(synonymRelationships),
  taxonomyMappings: many(occupationTaxonomyMapping),
}));

export const taxonomyGroupsRelations = relations(taxonomyGroups, ({ many }) => ({
  occupationMappings: many(occupationTaxonomyMapping),
}));

export const synonymRelationshipsRelations = relations(synonymRelationships, ({ one }) => ({
  synonym: one(synonyms, {
    fields: [synonymRelationships.synonymId],
    references: [synonyms.id],
  }),
  occupation: one(occupations, {
    fields: [synonymRelationships.occupationId],
    references: [occupations.id],
  }),
}));

export const occupationTaxonomyMappingRelations = relations(occupationTaxonomyMapping, ({ one }) => ({
  occupation: one(occupations, {
    fields: [occupationTaxonomyMapping.occupationId],
    references: [occupations.id],
  }),
  taxonomy: one(taxonomyGroups, {
    fields: [occupationTaxonomyMapping.taxonomyId],
    references: [taxonomyGroups.id],
  }),
}));

// Insert Schemas
export const insertTaxonomySourceSchema = createInsertSchema(taxonomySources).omit({
  id: true,
  createdAt: true,
});

export const insertSynonymSchema = createInsertSchema(synonyms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSynonymSourceMappingSchema = createInsertSchema(synonymSourceMapping).omit({
  id: true,
  createdAt: true,
});

export const insertOccupationSchema = createInsertSchema(occupations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaxonomyGroupSchema = createInsertSchema(taxonomyGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaxonomyRelationshipSchema = createInsertSchema(taxonomyRelationships).omit({
  relationshipId: true,
  createdAt: true,
});

export const insertSynonymRelationshipSchema = createInsertSchema(synonymRelationships).omit({
  id: true,
  createdAt: true,
});

export const insertOccupationSynonymSchema = createInsertSchema(occupationSynonyms).omit({
  id: true,
  createdAt: true,
});

export const insertOccupationTaxonomyMappingSchema = createInsertSchema(occupationTaxonomyMapping).omit({
  id: true,
  createdAt: true,
});

export const insertOccupationSourceMappingSchema = createInsertSchema(occupationSourceMapping).omit({
  id: true,
  createdAt: true,
});

// Types
export type TaxonomySource = typeof taxonomySources.$inferSelect;
export type InsertTaxonomySource = z.infer<typeof insertTaxonomySourceSchema>;

export type Synonym = typeof synonyms.$inferSelect;
export type InsertSynonym = z.infer<typeof insertSynonymSchema>;

export type SynonymSourceMapping = typeof synonymSourceMapping.$inferSelect;
export type InsertSynonymSourceMapping = z.infer<typeof insertSynonymSourceMappingSchema>;

export type Occupation = typeof occupations.$inferSelect;
export type InsertOccupation = z.infer<typeof insertOccupationSchema>;

export type TaxonomyGroup = typeof taxonomyGroups.$inferSelect;
export type InsertTaxonomyGroup = z.infer<typeof insertTaxonomyGroupSchema>;

export type TaxonomyRelationship = typeof taxonomyRelationships.$inferSelect;
export type InsertTaxonomyRelationship = z.infer<typeof insertTaxonomyRelationshipSchema>;

export type SynonymRelationship = typeof synonymRelationships.$inferSelect;
export type InsertSynonymRelationship = z.infer<typeof insertSynonymRelationshipSchema>;

export type OccupationSynonym = typeof occupationSynonyms.$inferSelect;
export type InsertOccupationSynonym = z.infer<typeof insertOccupationSynonymSchema>;

export type OccupationTaxonomyMapping = typeof occupationTaxonomyMapping.$inferSelect;
export type InsertOccupationTaxonomyMapping = z.infer<typeof insertOccupationTaxonomyMappingSchema>;

export type OccupationSourceMapping = typeof occupationSourceMapping.$inferSelect;
export type InsertOccupationSourceMapping = z.infer<typeof insertOccupationSourceMappingSchema>;

// Audit Log table for tracking all database changes
export const auditLog = pgTable("taxonomy_audit_log", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),
  recordId: text("record_id").notNull(), // Store as text to handle different ID types
  operation: text("operation").notNull(), // INSERT, UPDATE, DELETE
  oldValues: text("old_values"), // JSON string of old values (NULL for INSERT)
  newValues: text("new_values"), // JSON string of new values (NULL for DELETE)
  changedFields: text("changed_fields"), // JSON array of changed field names
  userId: text("user_id"), // User who made the change
  sessionId: text("session_id"), // Session identifier
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Keep existing users table for backward compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
