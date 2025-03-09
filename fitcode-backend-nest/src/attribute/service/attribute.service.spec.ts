import { BadRequestException, forwardRef } from '@nestjs/common';
import { Attribute } from '../entity/attribute.entity';
import { AttributeValue } from '../entity/attribute-value.entity';
import { AttributeService } from './attribute.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AttributeType } from '../../common/enum/attribute-type.enum';
import { AttributeModule } from '../attribute.module';
import { FirebaseModule } from '../../firebase/firebase.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '../../common/common.module';
import { CacheManagerModule } from '../../cache-manager/cache-manager.module';
import { ComponentModule } from '../../component/component.module';
import { CommonService } from '../../common/service/common.service';
import {
  Environment,
  validationSchema,
} from '../../config/environment-validation-schema';
import * as getFirebaseClient from '../../firebase/get-firebase-client';
import { FirebaseService } from '../../firebase/firebase.service';
import { AttributeRepository } from '../repository/attribute.repository';
import { ParamRepository } from '../repository/param.repository';
import { ParamService } from './param.service';

describe('AttributeService (unit)', () => {
  let service: AttributeService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validationSchema }),
        FirebaseModule.forRoot(),
        CommonModule,
      ],
      providers: [
        AttributeRepository,
        ParamRepository,
        AttributeService,
        ParamService,
      ],
      exports: [AttributeService, ParamService],
    }).compile();

    service = moduleRef.get(AttributeService);
  });

  it('should pass validation for correct attributes', () => {
    const attributes: Attribute[] = [
      {
        field: 'name',
        name: 'Exercise Name',
        type: AttributeType.String,
        required: true,
      },
      {
        field: 'difficulty',
        name: 'Difficulty',
        type: AttributeType.Number,
        required: false,
      },
      {
        field: 'isOutdoor',
        name: 'Outdoor Activity',
        type: AttributeType.Boolean,
        required: false,
      },
    ];

    const values: AttributeValue[] = [
      { field: 'name', value: 'Push-up' },
      { field: 'difficulty', value: '3' },
      { field: 'isOutdoor', value: 'true' },
    ];

    expect(service.validate(values, attributes)).toEqual(values);
  });

  it('should throw an error if a required attribute is missing', () => {
    const attributes: Attribute[] = [
      {
        field: 'name',
        name: 'Exercise Name',
        type: AttributeType.String,
        required: true,
      },
    ];

    const values: AttributeValue[] = [];
    expect(() => service.validate(values, attributes)).toThrow(
      BadRequestException,
    );

    expect(() => service.validate(values, attributes)).toThrow(
      'Attribute "Exercise Name" is required',
    );
  });

  it('should throw an error if a number attribute receives a string', () => {
    const attributes: Attribute[] = [
      {
        field: 'difficulty',
        name: 'Difficulty',
        type: AttributeType.Number,
        required: true,
      },
    ];

    const values: AttributeValue[] = [{ field: 'difficulty', value: 'hard' }];

    expect(() => service.validate(values, attributes)).toThrow(
      BadRequestException,
    );

    expect(() => service.validate(values, attributes)).toThrow(
      'Value for attribute "Difficulty" must be a number',
    );
  });

  it('should throw an error if a boolean attribute receives an invalid value', () => {
    const attributes: Attribute[] = [
      {
        field: 'isOutdoor',
        name: 'Outdoor Activity',
        type: AttributeType.Boolean,
        required: true,
      },
    ];

    const values: AttributeValue[] = [{ field: 'isOutdoor', value: 'yes' }];

    expect(() => service.validate(values, attributes)).toThrow(
      BadRequestException,
    );

    expect(() => service.validate(values, attributes)).toThrow(
      'Value for attribute "Outdoor Activity" must be a boolean',
    );
  });

  it('should validate select attributes correctly', () => {
    const attributes: Attribute[] = [
      {
        field: 'difficulty',
        name: 'Difficulty',
        type: AttributeType.Select,
        required: true,
        options: [
          { field: 'easy', name: 'Easy', type: AttributeType.Value },
          { field: 'med', name: 'Medium', type: AttributeType.Value },
          { field: 'hard', name: 'Hard', type: AttributeType.Value },
        ],
      },
    ];

    const validValues: AttributeValue[] = [
      { field: 'difficulty', value: 'med', selected: ['med'] },
    ];

    const invalidValues: AttributeValue[] = [
      { field: 'difficulty', value: 'extreme', selected: ['extreme'] },
    ];

    expect(service.validate(validValues, attributes)).toEqual(validValues);
    expect(() => service.validate(invalidValues, attributes)).toThrow(
      BadRequestException,
    );

    expect(() => service.validate(invalidValues, attributes)).toThrow(
      `Value "extreme" for attribute "Difficulty" is not a valid option`,
    );
  });

  it('should validate nested select attributes with hierarchical options correctly', () => {
    const attributes: Attribute[] = [
      {
        field: 'difficulty',
        name: 'Difficulty',
        type: AttributeType.Select,
        required: true,
        options: [
          {
            field: 'easy',
            name: 'Easy',
            type: AttributeType.Value,
          },
          {
            field: 'med',
            name: 'Medium',
            type: AttributeType.Value,
          },
          {
            field: 'hard',
            name: 'Hard',
            type: AttributeType.Value,
            options: [
              {
                field: 'extreme',
                name: 'Extreme',
                type: AttributeType.Value,
              },
              {
                field: 'expert',
                name: 'Expert',
                type: AttributeType.Value,
              },
            ],
          },
        ],
      },
    ];

    const validValues: AttributeValue[] = [
      { field: 'difficulty', value: 'hard.expert', selected: ['hard.expert'] },
    ];

    const invalidValues: AttributeValue[] = [
      {
        field: 'difficulty',
        value: 'hard.nonexistent',
        selected: ['hard.nonexistent'],
      },
    ];

    const validSimpleValues: AttributeValue[] = [
      { field: 'difficulty', value: 'easy', selected: ['easy'] },
    ];

    expect(service.validate(validValues, attributes)).toEqual(validValues);
    expect(() => service.validate(invalidValues, attributes)).toThrow(
      BadRequestException,
    );
    expect(() => service.validate(invalidValues, attributes)).toThrow(
      `Value "hard.nonexistent" for attribute "Difficulty" is not a valid option`,
    );
    expect(service.validate(validSimpleValues, attributes)).toEqual(
      validSimpleValues,
    );
  });

  it('should validate multiselect attributes correctly', () => {
    const attributes: Attribute[] = [
      {
        field: 'difficulty',
        name: 'Difficulty',
        type: AttributeType.Multiselect,
        required: true,
        options: [
          {
            field: 'easy',
            name: 'Easy',
            type: AttributeType.Value,
          },
          {
            field: 'medium',
            name: 'Medium',
            type: AttributeType.Value,
          },
          {
            field: 'hard',
            name: 'Hard',
            type: AttributeType.Value,
            options: [
              {
                field: 'extreme',
                name: 'Extreme',
                type: AttributeType.Value,
              },
              {
                field: 'expert',
                name: 'Expert',
                type: AttributeType.Value,
              },
            ],
          },
        ],
      },
    ];

    const validValues: AttributeValue[] = [
      {
        field: 'difficulty',
        value: 'hard.expert',
        selected: ['hard.expert', 'easy'],
      },
    ];

    const invalidValues: AttributeValue[] = [
      {
        field: 'difficulty',
        value: 'hard.nonexistent',
        selected: ['hard.nonexistent', 'easy'],
      },
    ];

    const emptyValues: AttributeValue[] = [
      { field: 'difficulty', value: '', selected: [] },
    ];

    expect(service.validate(validValues, attributes)).toEqual(validValues);
    expect(() => service.validate(invalidValues, attributes)).toThrow(
      BadRequestException,
    );
    expect(() => service.validate(invalidValues, attributes)).toThrow(
      `One or more selected values for attribute "Difficulty" are not valid options`,
    );
    expect(() => service.validate(emptyValues, attributes)).toThrow(
      BadRequestException,
    );
    expect(() => service.validate(emptyValues, attributes)).toThrow(
      'Attribute "Difficulty" is required',
    );
  });
});
