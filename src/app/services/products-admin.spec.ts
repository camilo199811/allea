import { TestBed } from '@angular/core/testing';
import { ProductsAdmin } from './products-admin';

describe('ProductsAdmin', () => {
  let service: ProductsAdmin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductsAdmin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
