import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmOtp } from './confirm-otp';

describe('ConfirmOtp', () => {
  let component: ConfirmOtp;
  let fixture: ComponentFixture<ConfirmOtp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmOtp],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmOtp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
