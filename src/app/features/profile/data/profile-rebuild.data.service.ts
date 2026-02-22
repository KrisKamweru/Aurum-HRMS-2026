import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { RebuildProfileRecord, RebuildProfileUpdateInput } from './profile-rebuild.models';

@Injectable({ providedIn: 'root' })
export class ProfileRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async getMyProfile(): Promise<RebuildProfileRecord | null> {
    const result = await this.convex.query(api.employees.getMyProfile, {});
    return this.mapProfile(result);
  }

  async updateMyProfile(input: RebuildProfileUpdateInput): Promise<void> {
    await this.convex.mutation(api.employees.updateMyProfile, {
      phone: this.normalizeOptional(input.phone),
      address: this.normalizeOptional(input.address),
      gender: this.normalizeOptional(input.gender),
      dob: this.normalizeOptional(input.dob)
    });
  }

  private mapProfile(value: unknown): RebuildProfileRecord | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const row = value as Record<string, unknown>;
    if (
      typeof row['_id'] !== 'string' ||
      typeof row['firstName'] !== 'string' ||
      typeof row['lastName'] !== 'string' ||
      typeof row['email'] !== 'string' ||
      typeof row['startDate'] !== 'string'
    ) {
      return null;
    }

    const userRaw = row['user'];
    const userRecord = userRaw && typeof userRaw === 'object' ? (userRaw as Record<string, unknown>) : {};

    return {
      id: row['_id'],
      firstName: row['firstName'],
      lastName: row['lastName'],
      email: row['email'],
      startDate: row['startDate'],
      status: typeof row['status'] === 'string' ? row['status'] : 'unknown',
      phone: typeof row['phone'] === 'string' ? row['phone'] : undefined,
      address: typeof row['address'] === 'string' ? row['address'] : undefined,
      gender: typeof row['gender'] === 'string' ? row['gender'] : undefined,
      dob: typeof row['dob'] === 'string' ? row['dob'] : undefined,
      department: typeof row['department'] === 'string' ? row['department'] : undefined,
      position: typeof row['position'] === 'string' ? row['position'] : undefined,
      location: typeof row['location'] === 'string' ? row['location'] : undefined,
      managerName: typeof row['managerName'] === 'string' ? row['managerName'] : undefined,
      tenure: typeof row['tenure'] === 'string' ? row['tenure'] : '',
      user: {
        name:
          typeof userRecord['name'] === 'string' && userRecord['name'].trim().length > 0
            ? userRecord['name']
            : `${row['firstName']} ${row['lastName']}`,
        email: typeof userRecord['email'] === 'string' ? userRecord['email'] : row['email'],
        imageUrl: typeof userRecord['image'] === 'string' ? userRecord['image'] : undefined,
        role: typeof userRecord['role'] === 'string' ? userRecord['role'] : 'employee'
      }
    };
  }

  private normalizeOptional(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }
}
