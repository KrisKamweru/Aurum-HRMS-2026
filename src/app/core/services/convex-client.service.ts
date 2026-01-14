import { Injectable, signal } from '@angular/core';
import { ConvexClient } from 'convex/browser';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConvexClientService {
  private client: ConvexClient;

  constructor() {
    this.client = new ConvexClient(environment.convexUrl);
  }

  getClient(): ConvexClient {
    return this.client;
  }
}
