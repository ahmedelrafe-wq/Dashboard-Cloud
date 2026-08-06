import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectCloud } from './connect-cloud';

describe('ConnectCloud', () => {
  let component: ConnectCloud;
  let fixture: ComponentFixture<ConnectCloud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectCloud],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectCloud);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
