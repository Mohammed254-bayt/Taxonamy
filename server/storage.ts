import {
  taxonomySources,
  synonyms,
  synonymSourceMapping,
  occupations,
  occupationSourceMapping,
  taxonomyGroups,
  taxonomyRelationships,
  synonymRelationships,
  occupationSynonyms,
  occupationTaxonomyMapping,
  users,
  type TaxonomySource,
  type InsertTaxonomySource,
  type Synonym,
  type InsertSynonym,
  type SynonymSourceMapping,
  type InsertSynonymSourceMapping,
  type Occupation,
  type InsertOccupation,
  type TaxonomyGroup,
  type InsertTaxonomyGroup,
  type TaxonomyRelationship,
  type InsertTaxonomyRelationship,
  type SynonymRelationship,
  type InsertSynonymRelationship,
  type OccupationSynonym,
  type InsertOccupationSynonym,
  type OccupationTaxonomyMapping,
  type InsertOccupationTaxonomyMapping,
  type User,
  type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { withAuditContext, type AuditContext } from "./audit";
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
  exists,
  inArray,
  not,
} from "drizzle-orm";

// AuditContext is now imported from "./audit"

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser, auditContext?: AuditContext): Promise<User>;

  // Taxonomy Sources
  getTaxonomySources(): Promise<TaxonomySource[]>;
  getTaxonomySource(id: number): Promise<TaxonomySource | undefined>;
  createTaxonomySource(source: InsertTaxonomySource, auditContext?: AuditContext): Promise<TaxonomySource>;
  updateTaxonomySource(
    id: number,
    source: Partial<InsertTaxonomySource>,
    auditContext?: AuditContext
  ): Promise<TaxonomySource | undefined>;
  deleteTaxonomySource(id: number, auditContext?: AuditContext): Promise<boolean>;

  // Synonyms
  getSynonyms(params?: {
    search?: string;
    language?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Synonym[]; total: number }>;
  getSynonym(id: number): Promise<Synonym | undefined>;
  createSynonym(synonym: InsertSynonym, auditContext?: AuditContext): Promise<Synonym>;
  updateSynonym(
    id: number,
    synonym: Partial<InsertSynonym>,
    auditContext?: AuditContext
  ): Promise<Synonym | undefined>;
  deleteSynonym(id: number, auditContext?: AuditContext): Promise<boolean>;

  // Synonym Source Mappings
  getSynonymSourceMappings(synonymId?: number): Promise<SynonymSourceMapping[]>;
  createSynonymSourceMapping(
    mapping: InsertSynonymSourceMapping,
    auditContext?: AuditContext
  ): Promise<SynonymSourceMapping>;
  deleteSynonymSourceMapping(id: number, auditContext?: AuditContext): Promise<boolean>;

  // Occupations
  getOccupations(params?: {
    search?: string;
    escoLevel?: string;
    careerLevel?: string;
    language?: string;
    limit?: number;
    offset?: number;
    unlinked?: boolean;
  }): Promise<{ data: Occupation[]; total: number }>;
  getOccupation(id: number): Promise<Occupation | undefined>;
  createOccupation(occupation: InsertOccupation, auditContext?: AuditContext): Promise<Occupation>;
  updateOccupation(
    id: number,
    occupation: Partial<InsertOccupation> & { sourceId?: number | null },
    auditContext?: AuditContext
  ): Promise<Occupation | undefined>;
  deleteOccupation(id: number, auditContext?: AuditContext): Promise<boolean>;

  // Taxonomy Groups
  getTaxonomyGroups(params?: {
    search?: string;
    level?: number;
    parentId?: number;
  }): Promise<TaxonomyGroup[]>;
  getTaxonomyGroup(id: number): Promise<TaxonomyGroup | undefined>;
  getTaxonomyGroupByEscoCode(
    escoCode: string,
  ): Promise<TaxonomyGroup | undefined>;
  createTaxonomyGroup(group: InsertTaxonomyGroup): Promise<TaxonomyGroup>;
  updateTaxonomyGroup(
    id: number,
    group: Partial<InsertTaxonomyGroup>,
  ): Promise<TaxonomyGroup | undefined>;
  deleteTaxonomyGroup(id: number): Promise<boolean>;
  getTaxonomyHierarchy(): Promise<TaxonomyGroup[]>;

  // Taxonomy Relationships
  getTaxonomyRelationships(fromGstId?: string): Promise<TaxonomyRelationship[]>;
  createTaxonomyRelationship(
    relationship: InsertTaxonomyRelationship,
  ): Promise<TaxonomyRelationship>;
  deleteTaxonomyRelationship(id: number): Promise<boolean>;

  // Synonym Relationships
  getSynonymRelationships(
    occupationId?: number,
  ): Promise<SynonymRelationship[]>;
  createSynonymRelationship(
    relationship: InsertSynonymRelationship,
  ): Promise<SynonymRelationship>;
  deleteSynonymRelationship(id: number): Promise<boolean>;

  // Occupation Taxonomy Mappings
  getOccupationTaxonomyMappings(
    occupationId?: number,
  ): Promise<OccupationTaxonomyMapping[]>;
  createOccupationTaxonomyMapping(
    mapping: InsertOccupationTaxonomyMapping,
  ): Promise<OccupationTaxonomyMapping>;
  deleteOccupationTaxonomyMapping(id: number): Promise<boolean>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalOccupations: number;
    totalSynonyms: number;
  }>;

  // Source Statistics
  getOccupationCountPerSource(): Promise<
    Array<{
      sourceId: number;
      sourceName: string;
      occupationCount: number;
    }>
  >;

  getSynonymCountPerSource(): Promise<
    Array<{
      sourceId: number;
      sourceName: string;
      synonymCount: number;
    }>
  >;

  // Additional Dashboard Metrics
  getAverageSynonymsPerOccupation(): Promise<number>;
  getUnlinkedOccupationCount(): Promise<number>;
  getOccupationWithMostSynonyms(): Promise<{
    occupationId: number;
    preferredLabelEn: string;
    synonymCount: number;
  } | null>;
  getOccupationWithFewestSynonyms(): Promise<{
    occupationId: number;
    preferredLabelEn: string;
    synonymCount: number;
  } | null>;

  // Recent Activity Metrics
  getLastAddedOccupations(): Promise<
    Array<{
      id: number;
      preferredLabelEn: string | null;
      escoCode: string | null;
      createdAt: Date;
    }>
  >;
  getLastAddedSynonyms(): Promise<
    Array<{
      id: number;
      title: string;
      createdAt: Date;
    }>
  >;

  // Data Completeness Metrics
  getOccupationsWithoutSource(): Promise<number>;
  getSynonymsWithoutSource(): Promise<number>;

  // Search
  globalSearch(term: string): Promise<{
    occupations: Occupation[];
    synonyms: Synonym[];
    taxonomyGroups: TaxonomyGroup[];
  }>;

  // Merge occupations
  mergeOccupations(sourceId: number, targetId: number): Promise<boolean>;

  // Occupation Details
  getOccupationDetails(id: number): Promise<{
    occupation: Occupation;
    parent: {
      type: "occupation" | "esco_group";
      id: number;
      label: string;
      code: string;
    } | null;
    children: Array<{
      id: number;
      preferredLabelEn: string;
      preferredLabelAr: string | null;
      escoCode: string | null;
      synonyms: string[];
    }>;
  } | null>;

  // Tree structure
  getRootTaxonomyGroups(): Promise<
    Array<{
      id: number;
      name: string;
      type: "group";
      hasChildren: boolean;
      childCount: number;
      description?: string;
    }>
  >;

  getChildrenByEntity(
    entityType: string,
    entityId: number,
  ): Promise<
    Array<{
      id: number;
      name: string;
      type: "group" | "occupation";
      hasChildren: boolean;
      childCount: number;
      description?: string;
    }>
  >;
}

export class DatabaseStorage implements IStorage {


  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser, auditContext?: AuditContext): Promise<User> {
    return withAuditContext(auditContext, async (clientDb) => {
      const [user] = await clientDb.insert(users).values(insertUser).returning();
      return user;
    });
  }

  // Taxonomy Sources
  async getTaxonomySources(): Promise<TaxonomySource[]> {
    return await db
      .select()
      .from(taxonomySources)
      .orderBy(asc(taxonomySources.name));
  }

  async getTaxonomySource(id: number): Promise<TaxonomySource | undefined> {
    const [source] = await db
      .select()
      .from(taxonomySources)
      .where(eq(taxonomySources.id, id));
    return source || undefined;
  }

  async createTaxonomySource(
    source: InsertTaxonomySource,
    auditContext?: AuditContext
  ): Promise<TaxonomySource> {
    return withAuditContext(auditContext, async (clientDb) => {
      const [created] = await clientDb
        .insert(taxonomySources)
        .values(source)
        .returning();
      return created;
    });
  }

  async updateTaxonomySource(
    id: number,
    source: Partial<InsertTaxonomySource>,
    auditContext?: AuditContext
  ): Promise<TaxonomySource | undefined> {
    return withAuditContext(auditContext, async (clientDb) => {
      const [updated] = await clientDb
        .update(taxonomySources)
        .set(source)
        .where(eq(taxonomySources.id, id))
        .returning();
      return updated || undefined;
    });
  }

  async deleteTaxonomySource(id: number, auditContext?: AuditContext): Promise<boolean> {
    return withAuditContext(auditContext, async (clientDb) => {
      const result = await clientDb
        .delete(taxonomySources)
        .where(eq(taxonomySources.id, id));
      return (result.rowCount ?? 0) > 0;
    });
  }

  // Synonyms
  async getSynonyms(
    params: {
      search?: string;
      language?: string;
      sourceId?: number;
      withoutSource?: boolean;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ data: Synonym[]; total: number }> {
    const {
      search,
      language,
      sourceId,
      withoutSource,
      limit = 50,
      offset = 0,
    } = params;

    if (sourceId) {
      // Query synonyms with specific source using Drizzle joins
      let query = db
        .select({
          id: synonyms.id,
          title: synonyms.title,
          titleOrig: synonyms.titleOrig,
          language: synonyms.language,
          createdAt: synonyms.createdAt,
          updatedAt: synonyms.updatedAt,
          sourceName: taxonomySources.name,
          sourceId: synonymSourceMapping.sourceId,
        })
        .from(synonyms)
        .innerJoin(
          synonymSourceMapping,
          eq(synonyms.id, synonymSourceMapping.synonymId),
        )
        .innerJoin(
          taxonomySources,
          eq(synonymSourceMapping.sourceId, taxonomySources.id),
        )
        .where(eq(synonymSourceMapping.sourceId, sourceId));

      let countQuery = db
        .select({ count: count() })
        .from(synonyms)
        .innerJoin(
          synonymSourceMapping,
          eq(synonyms.id, synonymSourceMapping.synonymId),
        )
        .where(eq(synonymSourceMapping.sourceId, sourceId));

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

      query = query
        .orderBy(desc(synonyms.createdAt))
        .limit(limit)
        .offset(offset);

      const [data, countResult] = await Promise.all([query, countQuery]);

      return {
        data,
        total: countResult[0]?.count || 0,
      };
    } else if (withoutSource) {
      // Query synonyms without source using NOT EXISTS
      const conditions = [
        notExists(
          db
            .select()
            .from(synonymSourceMapping)
            .where(eq(synonymSourceMapping.synonymId, synonyms.id)),
        ),
      ];

      if (search) {
        conditions.push(ilike(synonyms.title, `%${search}%`));
      }
      if (language) {
        conditions.push(eq(synonyms.language, language));
      }

      let query = db
        .select({
          id: synonyms.id,
          title: synonyms.title,
          titleOrig: synonyms.titleOrig,
          language: synonyms.language,
          createdAt: synonyms.createdAt,
          updatedAt: synonyms.updatedAt,
          sourceName: sql<string | null>`NULL`.as('sourceName'),
          sourceId: sql<number | null>`NULL`.as('sourceId'),
        })
        .from(synonyms)
        .where(and(...conditions))
        .orderBy(desc(synonyms.createdAt))
        .limit(limit)
        .offset(offset);

      let countQuery = db
        .select({ count: count() })
        .from(synonyms)
        .where(and(...conditions));

      const [data, countResult] = await Promise.all([query, countQuery]);

      return {
        data,
        total: countResult[0]?.count || 0,
      };
    } else {
      // Query all synonyms with source information using LEFT JOIN
      let query = db
        .select({
          id: synonyms.id,
          title: synonyms.title,
          titleOrig: synonyms.titleOrig,
          language: synonyms.language,
          createdAt: synonyms.createdAt,
          updatedAt: synonyms.updatedAt,
          sourceName: taxonomySources.name,
          sourceId: synonymSourceMapping.sourceId,
        })
        .from(synonyms)
        .leftJoin(
          synonymSourceMapping,
          eq(synonyms.id, synonymSourceMapping.synonymId),
        )
        .leftJoin(
          taxonomySources,
          eq(synonymSourceMapping.sourceId, taxonomySources.id),
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
        const whereClause =
          conditions.length === 1 ? conditions[0] : and(...conditions);
        query = query.where(whereClause);
        countQuery = countQuery.where(whereClause);
      }

      const [data, totalResult] = await Promise.all([
        query.orderBy(desc(synonyms.createdAt)).limit(limit).offset(offset),
        countQuery,
      ]);

      return {
        data,
        total: totalResult[0].count,
      };
    }
  }

  async getSynonym(id: number): Promise<any | undefined> {
    const [synonym] = await db
      .select({
        id: synonyms.id,
        title: synonyms.title,
        titleOrig: synonyms.titleOrig,
        language: synonyms.language,
        createdAt: synonyms.createdAt,
        updatedAt: synonyms.updatedAt,
        sourceId: synonymSourceMapping.sourceId,
        sourceName: taxonomySources.name,
      })
      .from(synonyms)
      .leftJoin(
        synonymSourceMapping,
        eq(synonyms.id, synonymSourceMapping.synonymId),
      )
      .leftJoin(
        taxonomySources,
        eq(synonymSourceMapping.sourceId, taxonomySources.id),
      )
      .where(eq(synonyms.id, id));
    return synonym || undefined;
  }

  async createSynonym(synonym: InsertSynonym, auditContext?: AuditContext): Promise<Synonym> {
    return withAuditContext(auditContext, async (clientDb) => {
      const [created] = await clientDb.insert(synonyms).values(synonym).returning();
      return created;
    });
  }

  async updateSynonym(
    id: number,
    synonym: Partial<InsertSynonym> & { sourceId?: number | null },
    auditContext?: AuditContext
  ): Promise<Synonym | undefined> {
    return withAuditContext(auditContext, async (clientDb) => {
      return await clientDb.transaction(async (tx) => {
        // Extract sourceId from synonym data (it doesn't belong in synonyms table)
        const { sourceId, ...synonymData } = synonym;
        
        // Update synonym record (without sourceId)
        const [updated] = await tx
          .update(synonyms)
          .set({ ...synonymData, updatedAt: new Date() })
          .where(eq(synonyms.id, id))
          .returning();

        if (!updated) {
          return undefined;
        }

        // Handle source mapping if sourceId is provided (including null to remove)
        if ('sourceId' in synonym) {
          // Remove existing mapping first
          await tx
            .delete(synonymSourceMapping)
            .where(eq(synonymSourceMapping.synonymId, id));

          // Insert new mapping if sourceId is provided (not null)
          if (sourceId !== null && sourceId !== undefined) {
            // Only insert the required fields and let the database auto-generate the id
            await tx.insert(synonymSourceMapping).values({
              synonymId: id,
              sourceId: sourceId,
            });
          }
        }

        return updated;
      });
    });
  }

  async deleteSynonym(id: number, auditContext?: AuditContext): Promise<boolean> {
    return withAuditContext(auditContext, async (clientDb) => {
      return await clientDb.transaction(async (tx) => {
        // First delete all occupation-synonym relationships
        await tx.delete(occupationSynonyms).where(eq(occupationSynonyms.synonymId, id));
        
        // Then delete all source mappings for this synonym
        await tx.delete(synonymSourceMapping).where(eq(synonymSourceMapping.synonymId, id));
        
        // Finally delete the synonym itself
        const result = await tx.delete(synonyms).where(eq(synonyms.id, id));
        return (result.rowCount ?? 0) > 0;
      });
    });
  }

  // Synonym Source Mappings
  async getSynonymSourceMappings(
    synonymId?: number,
  ): Promise<SynonymSourceMapping[]> {
    let query = db.select().from(synonymSourceMapping);
    if (synonymId) {
      query = query.where(eq(synonymSourceMapping.synonymId, synonymId));
    }
    return await query.orderBy(desc(synonymSourceMapping.createdAt));
  }

  async createSynonymSourceMapping(
    mapping: InsertSynonymSourceMapping,
    auditContext?: AuditContext
  ): Promise<SynonymSourceMapping> {
    return withAuditContext(auditContext, async (clientDb) => {
      const [created] = await clientDb
        .insert(synonymSourceMapping)
        .values(mapping)
        .returning();
      return created;
    });
  }

  async deleteSynonymSourceMapping(id: number, auditContext?: AuditContext): Promise<boolean> {
    return withAuditContext(auditContext, async (clientDb) => {
      const result = await clientDb
        .delete(synonymSourceMapping)
        .where(eq(synonymSourceMapping.id, id));
      return (result.rowCount ?? 0) > 0;
    });
  }

  async getOccupations(
    params: {
      search?: string;
      escoLevel?: string;
      careerLevel?: string;
      language?: string;
      sourceId?: number;
      withoutSource?: boolean;
      limit?: number;
      offset?: number;
      unlinked?: boolean;
    } = {},
  ): Promise<{ data: Occupation[]; total: number }> {
    const {
      search,
      escoLevel,
      careerLevel,
      language,
      sourceId,
      withoutSource,
      limit = 50,
      offset = 0,
      unlinked = false,
    } = params;

    // Base queries with source information
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
      sourceName: taxonomySources.name,
    }).from(occupations)
      .leftJoin(occupationSourceMapping, eq(occupations.id, occupationSourceMapping.occupationId))
      .leftJoin(taxonomySources, eq(occupationSourceMapping.sourceId, taxonomySources.id));
    
    let countQuery = db.select({ count: count() }).from(occupations)
      .leftJoin(occupationSourceMapping, eq(occupations.id, occupationSourceMapping.occupationId))
      .leftJoin(taxonomySources, eq(occupationSourceMapping.sourceId, taxonomySources.id));

    const conditions = [];

    // Search filters
    if (search) {
      if (language === "ar") {
        conditions.push(
          or(
            ilike(occupations.preferredLabelAr, `%${search}%`),
            ilike(occupations.descriptionAr, `%${search}%`),
          ),
        );
      } else {
        conditions.push(
          or(
            ilike(occupations.preferredLabelEn, `%${search}%`),
            ilike(occupations.descriptionEn, `%${search}%`),
            ilike(occupations.escoCode, `%${search}%`),
          ),
        );
      }
    }

    // Career level filter
    if (careerLevel) {
      const level = parseInt(careerLevel);
      conditions.push(
        or(
          eq(occupations.minCareerLevel, level),
          eq(occupations.maxCareerLevel, level),
        ),
      );
    }

    // Unlinked (taxonomy) filter
    if (unlinked) {
      conditions.push(
        notExists(
          db
            .select()
            .from(taxonomyRelationships)
            .where(
              or(
                and(
                  eq(taxonomyRelationships.sourceEntityType, "occupation"),
                  eq(taxonomyRelationships.sourceEntityId, occupations.id),
                ),
                and(
                  eq(taxonomyRelationships.targetEntityType, "occupation"),
                  eq(taxonomyRelationships.targetEntityId, occupations.id),
                ),
              ),
            ),
        ),
      );
    }

    // Filter by sourceId (occupation has this source)
    if (sourceId) {
      conditions.push(
        exists(
          db
            .select()
            .from(occupationSourceMapping)
            .where(
              and(
                eq(occupationSourceMapping.occupationId, occupations.id),
                eq(occupationSourceMapping.sourceId, sourceId),
              ),
            ),
        ),
      );
    }

    // Filter occupations without any source
    if (withoutSource) {
      conditions.push(
        notExists(
          db
            .select()
            .from(occupationSourceMapping)
            .where(eq(occupationSourceMapping.occupationId, occupations.id)),
        ),
      );
    }

    // Apply conditions to query
    if (conditions.length > 0) {
      const whereClause =
        conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    const [data, totalResult] = await Promise.all([
      query.orderBy(desc(occupations.createdAt)).limit(limit).offset(offset),
      countQuery,
    ]);

    return {
      data,
      total: totalResult[0].count,
    };
  }

  async getOccupation(id: number): Promise<Occupation | undefined> {
    const [occupation] = await db
      .select()
      .from(occupations)
      .where(eq(occupations.id, id));
    return occupation || undefined;
  }

  async createOccupation(occupation: InsertOccupation, auditContext?: AuditContext): Promise<Occupation> {
    return withAuditContext(auditContext, async (clientDb) => {
      const [created] = await clientDb
        .insert(occupations)
        .values(occupation)
        .returning();
      return created;
    });
  }

  async updateOccupation(
    id: number,
    occupation: Partial<InsertOccupation> & { sourceId?: number | null },
    auditContext?: AuditContext
  ): Promise<Occupation | undefined> {
    return withAuditContext(auditContext, async (clientDb) => {
      return await clientDb.transaction(async (tx) => {
        // Extract sourceId from occupation data (it doesn't belong in occupations table)
        const { sourceId, ...occupationData } = occupation;
        
        // Update occupation record (without sourceId)
        const [updated] = await tx
          .update(occupations)
          .set({ ...occupationData, updatedAt: new Date() })
          .where(eq(occupations.id, id))
          .returning();

        if (!updated) {
          return undefined;
        }

        // Handle source mapping if sourceId is provided (including null to remove)
        if ('sourceId' in occupation) {
          // Remove existing mapping first
          await tx
            .delete(occupationSourceMapping)
            .where(eq(occupationSourceMapping.occupationId, id));

          // Insert new mapping if sourceId is provided (not null)
          if (sourceId !== null && sourceId !== undefined) {
            await tx.insert(occupationSourceMapping).values({
              occupationId: id,
              sourceId: sourceId,
            });
          }
        }

        return updated;
      });
    });
  }

  async deleteOccupation(id: number, auditContext?: AuditContext): Promise<boolean> {
    return withAuditContext(auditContext, async (clientDb) => {
      return await clientDb.transaction(async (tx) => {
        try {
          // Delete all taxonomy relationships where this occupation is involved
          await tx
            .delete(taxonomyRelationships)
            .where(
              or(
                and(
                  eq(taxonomyRelationships.sourceEntityType, "occupation"),
                  eq(taxonomyRelationships.sourceEntityId, id),
                ),
                and(
                  eq(taxonomyRelationships.targetEntityType, "occupation"),
                  eq(taxonomyRelationships.targetEntityId, id),
                ),
              ),
            );

          // Delete all occupation-synonym relationships
          await tx
            .delete(occupationSynonyms)
            .where(eq(occupationSynonyms.occupationId, id));

          // Delete all occupation source mappings
          await tx
            .delete(occupationSourceMapping)
            .where(eq(occupationSourceMapping.occupationId, id));

          // Only delete from tables that exist in the schema
          // Skip synonym_relationships and occupation_taxonomy_mapping for now
          // as they may not exist in your current database

          // Finally, delete the occupation itself
          const result = await tx.delete(occupations).where(eq(occupations.id, id));

          return (result.rowCount || 0) > 0;
        } catch (error) {
          console.error(`Error in deleteOccupation transaction for ID ${id}:`, error);
          throw error;
        }
      });
    });
  }

  // Taxonomy Groups
  async getTaxonomyGroups(
    params: { search?: string; level?: number; parentId?: number } = {},
  ): Promise<TaxonomyGroup[]> {
    const { search, level, parentId } = params;

    let query = db.select().from(taxonomyGroups);

    const conditions = [];
    if (search) {
      query = query.where(
        ilike(taxonomyGroups.preferredLabelEn, `%${search}%`),
      );
    }

    return await query.orderBy(asc(taxonomyGroups.preferredLabelEn));
  }

  async getTaxonomyGroup(id: number): Promise<TaxonomyGroup | undefined> {
    const [group] = await db
      .select()
      .from(taxonomyGroups)
      .where(eq(taxonomyGroups.id, id));
    return group || undefined;
  }

  async getTaxonomyGroupByEscoCode(
    escoCode: string,
  ): Promise<TaxonomyGroup | undefined> {
    const [group] = await db
      .select()
      .from(taxonomyGroups)
      .where(eq(taxonomyGroups.escoCode, escoCode));
    return group || undefined;
  }

  async createTaxonomyGroup(
    group: InsertTaxonomyGroup,
  ): Promise<TaxonomyGroup> {
    const [created] = await db.insert(taxonomyGroups).values(group).returning();
    return created;
  }

  async updateTaxonomyGroup(
    id: number,
    group: Partial<InsertTaxonomyGroup>,
  ): Promise<TaxonomyGroup | undefined> {
    const [updated] = await db
      .update(taxonomyGroups)
      .set({ ...group, updatedAt: new Date() })
      .where(eq(taxonomyGroups.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTaxonomyGroup(id: number): Promise<boolean> {
    const result = await db
      .delete(taxonomyGroups)
      .where(eq(taxonomyGroups.id, id));
    return result.rowCount > 0;
  }

  async getTaxonomyHierarchy(): Promise<TaxonomyGroup[]> {
    return await db
      .select()
      .from(taxonomyGroups)
      .orderBy(asc(taxonomyGroups.preferredLabelEn));
  }

  // Taxonomy Relationships
  async getTaxonomyRelationships(
    fromGstId?: string,
  ): Promise<TaxonomyRelationship[]> {
    let query = db.select().from(taxonomyRelationships);
    if (fromGstId) {
      query = query.where(
        eq(taxonomyRelationships.sourceEntityId, parseInt(fromGstId)),
      );
    }
    return await query.orderBy(desc(taxonomyRelationships.createdAt));
  }

  async createTaxonomyRelationship(
    relationship: InsertTaxonomyRelationship,
  ): Promise<TaxonomyRelationship> {
    const [created] = await db
      .insert(taxonomyRelationships)
      .values(relationship)
      .returning();
    return created;
  }

  async deleteTaxonomyRelationship(id: number): Promise<boolean> {
    const result = await db
      .delete(taxonomyRelationships)
      .where(eq(taxonomyRelationships.relationshipId, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Synonym Relationships
  async getSynonymRelationships(occupationId?: number): Promise<any[]> {
    // Use occupation_synonyms table instead of synonym_relationships
    if (occupationId) {
      const result = await db
        .select({
          id: synonyms.id,
          title: synonyms.title,
        })
        .from(occupationSynonyms)
        .innerJoin(synonyms, eq(occupationSynonyms.synonymId, synonyms.id))
        .where(eq(occupationSynonyms.occupationId, occupationId));

      return result;
    }

    return [];
  }

  async createSynonymRelationship(relationship: any): Promise<any> {
    // Use occupation_synonyms table instead
    const [created] = await db
      .insert(occupationSynonyms)
      .values({
        occupationId: relationship.occupationId,
        synonymId: relationship.synonymId,
      })
      .returning();
    return created;
  }

  async deleteSynonymRelationship(id: number): Promise<boolean> {
    // Delete from occupation_synonyms table using synonym_id
    const result = await db
      .delete(occupationSynonyms)
      .where(eq(occupationSynonyms.synonymId, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Occupation Taxonomy Mappings - These tables don't exist in current schema
  async getOccupationTaxonomyMappings(occupationId?: number): Promise<any[]> {
    // Return empty array since table doesn't exist
    return [];
  }

  async createOccupationTaxonomyMapping(mapping: any): Promise<any> {
    // No-op since table doesn't exist
    return mapping;
  }

  async deleteOccupationTaxonomyMapping(id: number): Promise<boolean> {
    // No-op since table doesn't exist
    return true;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalOccupations: number;
    totalSynonyms: number;
  }> {
    const [occupationsCount] = await db
      .select({ count: count() })
      .from(occupations);
    const [synonymsCount] = await db.select({ count: count() }).from(synonyms);

    return {
      totalOccupations: occupationsCount.count,
      totalSynonyms: synonymsCount.count,
    };
  }

  // Source Statistics
  async getOccupationCountPerSource(): Promise<
    Array<{
      sourceId: number;
      sourceName: string;
      occupationCount: number;
    }>
  > {
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

    return result.rows.map((row: any) => ({
      sourceId: row.source_id,
      sourceName: row.source_name,
      occupationCount: parseInt(row.occupation_count) || 0,
    }));
  }

  async getSynonymCountPerSource(): Promise<
    Array<{
      sourceId: number;
      sourceName: string;
      synonymCount: number;
    }>
  > {
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

    return result.rows.map((row: any) => ({
      sourceId: row.source_id,
      sourceName: row.source_name,
      synonymCount: parseInt(row.synonym_count) || 0,
    }));
  }

  // Additional Dashboard Metrics
  async getAverageSynonymsPerOccupation(): Promise<number> {
    const result = await db.execute(sql`
      SELECT 
        ROUND(CAST(COUNT(os.synonym_id) AS NUMERIC) / COUNT(DISTINCT os.occupation_id), 2) 
        AS avg_synonyms_per_occupation
      FROM occupation_synonyms os
    `);

    return result.rows.length > 0
      ? parseFloat(String(result.rows[0].avg_synonyms_per_occupation)) || 0
      : 0;
  }

  async getUnlinkedOccupationCount(): Promise<number> {
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

    return result.rows.length > 0
      ? parseInt(String(result.rows[0].unlinked_occupation_count)) || 0
      : 0;
  }

  async getOccupationWithMostSynonyms(): Promise<{
    occupationId: number;
    preferredLabelEn: string;
    synonymCount: number;
  } | null> {
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
      const row = result.rows[0] as any;
      return {
        occupationId: Number(row.occupation_id),
        preferredLabelEn: String(row.preferred_label_en || "Untitled"),
        synonymCount: parseInt(String(row.synonym_count)) || 0,
      };
    }
    return null;
  }

  async getOccupationWithFewestSynonyms(): Promise<{
    occupationId: number;
    preferredLabelEn: string;
    synonymCount: number;
  } | null> {
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
      const row = result.rows[0] as any;
      return {
        occupationId: Number(row.occupation_id),
        preferredLabelEn: String(row.preferred_label_en || "Untitled"),
        synonymCount: parseInt(String(row.synonym_count)) || 0,
      };
    }
    return null;
  }

  // Recent Activity Metrics
  async getLastAddedOccupations(): Promise<
    Array<{
      id: number;
      preferredLabelEn: string | null;
      escoCode: string | null;
      createdAt: Date;
    }>
  > {
    const result = await db.execute(sql`
      SELECT id, preferred_label_en, esco_code, created_at
      FROM occupations
      ORDER BY created_at DESC
      LIMIT 3
    `);

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      preferredLabelEn: row.preferred_label_en || null,
      escoCode: row.esco_code || null,
      createdAt: new Date(row.created_at),
    }));
  }

  async getLastAddedSynonyms(): Promise<
    Array<{
      id: number;
      title: string;
      createdAt: Date;
    }>
  > {
    const result = await db.execute(sql`
      SELECT id, title, created_at
      FROM synonyms
      ORDER BY created_at DESC
      LIMIT 3
    `);

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      title: String(row.title),
      createdAt: new Date(row.created_at),
    }));
  }

  // Data Completeness Metrics
  async getOccupationsWithoutSource(): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) AS occupations_without_source
      FROM occupations o
      WHERE o.id NOT IN (
        SELECT occupation_id FROM occupation_source_mapping
      )
    `);

    return result.rows.length > 0
      ? parseInt(String(result.rows[0].occupations_without_source)) || 0
      : 0;
  }

  async getSynonymsWithoutSource(): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) AS synonyms_without_source
      FROM synonyms s
      WHERE s.id NOT IN (
        SELECT synonym_id FROM synonym_source_mapping
      )
    `);

    return result.rows.length > 0
      ? parseInt(String(result.rows[0].synonyms_without_source)) || 0
      : 0;
  }

  // Global Search
  async globalSearch(term: string): Promise<{
    occupations: Occupation[];
    synonyms: Synonym[];
    taxonomyGroups: TaxonomyGroup[];
  }> {
    const searchTerm = `%${term}%`;

    const [occupationsResult, synonymsResult, taxonomyResult] =
      await Promise.all([
        db
          .select()
          .from(occupations)
          .where(
            or(
              ilike(occupations.preferredLabelEn, searchTerm),
              ilike(occupations.preferredLabelAr, searchTerm),
              ilike(occupations.escoCode, searchTerm),
            ),
          )
          .limit(10),
        db
          .select()
          .from(synonyms)
          .where(ilike(synonyms.title, searchTerm))
          .limit(10),
        db
          .select()
          .from(taxonomyGroups)
          .where(ilike(taxonomyGroups.preferredLabelEn, searchTerm))
          .limit(10),
      ]);

    return {
      occupations: occupationsResult,
      synonyms: synonymsResult,
      taxonomyGroups: taxonomyResult,
    };
  }

  // Tree structure methods
  async getRootTaxonomyGroups(): Promise<
    Array<{
      id: number;
      name: string;
      type: "group";
      hasChildren: boolean;
      childCount: number;
      description?: string;
    }>
  > {
    // Get root taxonomy_groups (those without parents) using the provided SQL
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
      // Check if this group has children
      const childCount = await this.getChildrenCount(
        "esco_group",
        Number(group.id),
      );

      result.push({
        id: Number(group.id),
        name: String(group.preferred_label_en) || "Unnamed Group",
        type: "group" as const,
        hasChildren: childCount > 0,
        childCount,
        description: undefined,
      });
    }

    return result;
  }

  async getChildrenByEntity(
    entityType: string,
    entityId: number,
  ): Promise<
    Array<{
      id: number;
      name: string;
      type: "group" | "occupation";
      hasChildren: boolean;
      childCount: number;
      description?: string;
    }>
  > {
    // Use INNER JOINs to automatically exclude deleted entities
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
      // Skip if child_label is null (deleted occupations/groups)
      if (!child.child_label) {
        continue;
      }

      // Determine child count
      const childType = String(child.child_type);
      const childCount = await this.getChildrenCount(
        childType,
        Number(child.child_id),
      );

      result.push({
        id: Number(child.child_id),
        name: String(child.child_label),
        type:
          childType === "esco_group"
            ? ("group" as const)
            : ("occupation" as const),
        hasChildren: childCount > 0,
        childCount,
        description: undefined,
      });
    }

    return result;
  }

  async getOccupationDetails(id: number) {
    // Get the occupation itself
    const occupation = await this.getOccupation(id);
    if (!occupation) {
      return null;
    }

    // Get parent relationship using optimized query
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
      const parentRow = parentResult.rows[0] as any;
      parent = {
        type: parentRow.source_entity_type as "occupation" | "esco_group",
        id: parentRow.source_entity_id,
        label: parentRow.parent_label || "Untitled",
        code: parentRow.parent_code || "",
      };
    }

    // Get child occupations with their synonyms using optimized query
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

    const children = childrenResult.rows.map((row: any) => ({
      id: row.occupation_id,
      preferredLabelEn: row.preferred_label_en || "Untitled",
      preferredLabelAr: row.preferred_label_ar,
      escoCode: row.esco_code,
      synonyms: Array.isArray(row.synonyms) ? row.synonyms.filter(Boolean) : [],
    }));

    return {
      occupation,
      parent,
      children,
    };
  }

  private async getChildrenCount(
    entityType: string,
    entityId: number,
  ): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(taxonomyRelationships)
      .where(
        and(
          eq(taxonomyRelationships.sourceEntityType, entityType),
          eq(taxonomyRelationships.sourceEntityId, entityId),
          eq(taxonomyRelationships.relationshipType, "contains"),
        ),
      );

    return result?.count || 0;
  }

  async mergeOccupations(sourceId: number, targetId: number): Promise<boolean> {
    try {
      // Prevent merging into the same occupation
      if (sourceId === targetId) {
        throw new Error("Cannot merge an occupation with itself");
      }

      // Verify both occupations exist
      const sourceOccupation = await this.getOccupation(sourceId);
      const targetOccupation = await this.getOccupation(targetId);

      if (!sourceOccupation) {
        throw new Error("Source occupation not found");
      }
      if (!targetOccupation) {
        throw new Error("Target occupation not found");
      }

      // Check for circular relationships - prevent merging if target is a descendant of source
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
          "Merge not allowed: The selected target occupation is a descendant of the source occupation. Merging would break the hierarchy.",
        );
      }

      // Start transaction
      await db.execute(sql`BEGIN`);

      try {
        // 1. Insert preferred_label_en as synonym if not duplicate
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

        // 2. Insert preferred_label_ar as synonym if not duplicate
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

        // 3. Link new synonyms to target occupation
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

        // 4. Move existing synonyms from source to target (avoid duplicates)
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

        // 5. Delete existing synonym relationships for source occupation
        await db.execute(sql`
          DELETE FROM occupation_synonyms WHERE occupation_id = ${sourceId}
        `);

        // 6. Delete all taxonomy relationships involving the source occupation
        await db.execute(sql`
          DELETE FROM taxonomy_relationships 
          WHERE (source_entity_type = 'occupation' AND source_entity_id = ${sourceId})
             OR (target_entity_type = 'occupation' AND target_entity_id = ${sourceId})
        `);

        // 7. Finally, delete the source occupation
        await db.execute(sql`
          DELETE FROM occupations WHERE id = ${sourceId}
        `);

        // Commit transaction
        await db.execute(sql`COMMIT`);
        return true;
      } catch (error) {
        // Rollback transaction on error
        await db.execute(sql`ROLLBACK`);
        throw error;
      }
    } catch (error) {
      console.error("Error merging occupations:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
