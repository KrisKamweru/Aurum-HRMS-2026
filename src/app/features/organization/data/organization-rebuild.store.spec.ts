import { TestBed } from '@angular/core/testing';
import { OrganizationRebuildStore } from './organization-rebuild.store';

describe('OrganizationRebuildStore', () => {
  let store: OrganizationRebuildStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OrganizationRebuildStore);
  });

  it('provides seeded datasets', () => {
    expect(store.departments().length).toBe(2);
    expect(store.designations().length).toBe(2);
    expect(store.locations().length).toBe(2);
  });

  it('adds unique departments and blocks duplicates', () => {
    expect(store.addDepartment('Finance')).toBe(true);
    expect(store.addDepartment('finance')).toBe(false);
    expect(store.departments().some((row) => row.name === 'Finance')).toBe(true);
  });

  it('removes departments by id', () => {
    const target = store.departments()[0];
    expect(store.removeDepartment(target.id)).toBe(true);
    expect(store.departments().some((row) => row.id === target.id)).toBe(false);
  });

  it('adds unique designations and blocks duplicates', () => {
    expect(store.addDesignation('QA Engineer', 2)).toBe(true);
    expect(store.addDesignation('qa engineer', 4)).toBe(false);
    expect(store.designations().some((row) => row.title === 'QA Engineer')).toBe(true);
  });

  it('removes designations by id', () => {
    const target = store.designations()[0];
    expect(store.removeDesignation(target.id)).toBe(true);
    expect(store.designations().some((row) => row.id === target.id)).toBe(false);
  });

  it('adds unique locations and blocks duplicates by name+city', () => {
    expect(store.addLocation('Innovation Hub', 'Austin', 'USA')).toBe(true);
    expect(store.addLocation('Innovation Hub', 'Austin', 'USA')).toBe(false);
    expect(store.locations().some((row) => row.name === 'Innovation Hub' && row.city === 'Austin')).toBe(true);
  });

  it('removes locations by id', () => {
    const target = store.locations()[0];
    expect(store.removeLocation(target.id)).toBe(true);
    expect(store.locations().some((row) => row.id === target.id)).toBe(false);
  });
});
