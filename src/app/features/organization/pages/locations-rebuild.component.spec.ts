import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationsRebuildComponent } from './locations-rebuild.component';

describe('LocationsRebuildComponent', () => {
  let fixture: ComponentFixture<LocationsRebuildComponent>;
  let component: LocationsRebuildComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationsRebuildComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LocationsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with seeded locations', () => {
    expect(component.locations().length).toBe(2);
    expect(component.locations().map((d) => d.name)).toEqual(['Nairobi HQ', 'Bengaluru Engineering Center']);
  });

  it('adds a new location', () => {
    component.newLocationName.set('London Hub');
    component.newLocationCity.set('London');
    component.newLocationCountry.set('UK');
    component.addLocation();

    expect(component.locations().some((d) => d.name === 'London Hub' && d.city === 'London')).toBe(true);
  });

  it('removes an existing location', () => {
    const target = component.locations()[0];
    component.removeLocation(target.id);

    expect(component.locations().some((d) => d.id === target.id)).toBe(false);
  });
});
