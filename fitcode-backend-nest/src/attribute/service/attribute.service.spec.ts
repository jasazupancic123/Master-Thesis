import { BadRequestException } from '@nestjs/common';
import { Attribute } from '../entity/attribute.entity';
import { AttributeValue } from '../entity/attribute-value.entity';
import { AttributeService } from './attribute.service';
import { Test } from '@nestjs/testing';
import { AttributeType } from '../../common/enum/attribute-type.enum';
import { FirebaseModule } from '../../firebase/firebase.module';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../common/common.module';
import { validationSchema } from '../../config/environment-validation-schema';
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
      { field: 'name', value: 'Push-up', selected: 'Push-up' },
      { field: 'difficulty', value: '3', selected: '3' },
      { field: 'isOutdoor', value: 'true', selected: 'true' },
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

    const values: AttributeValue[] = [
      { field: 'difficulty', value: 'hard', selected: 'hard' },
    ];

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

    const values: AttributeValue[] = [
      { field: 'isOutdoor', value: 'yes', selected: 'yes' },
    ];

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
      { field: 'difficulty', value: 'easy', selected: 'easy' },
    ];

    const invalidValues: AttributeValue[] = [
      { field: 'difficulty', value: 'extreme', selected: 'extreme' },
    ];

    expect(service.validate(validValues, attributes)).toEqual(validValues);
    expect(() => service.validate(invalidValues, attributes)).toThrow(
      BadRequestException,
    );

    expect(() => service.validate(invalidValues, attributes)).toThrow(
      `Value "extreme" for attribute "Difficulty" is not a valid option`,
    );
  });

  it('should validate nested select attributes correctly', () => {
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
            type: AttributeType.Select,
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
      { field: 'difficulty', value: 'expert', selected: 'hard.expert' },
    ];

    const invalidValues: AttributeValue[] = [
      {
        field: 'difficulty',
        value: 'nonexistent',
        selected: 'hard.nonexistent',
      },
    ];

    const validSimpleValues: AttributeValue[] = [
      { field: 'difficulty', value: 'easy', selected: 'easy' },
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

  it('should validate select attributes with non-value select options (number, string, boolean)', () => {
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
            type: AttributeType.Number,
          },
          {
            field: 'med',
            name: 'Medium',
            type: AttributeType.String,
          },
          {
            field: 'hard',
            name: 'Hard',
            type: AttributeType.Boolean,
          },
        ],
      },
    ];

    const validValues: AttributeValue[] = [
      { field: 'difficulty', value: 'my string', selected: 'med' },
    ];

    const invalidValues: AttributeValue[] = [
      {
        field: 'difficulty',
        value: 'this should be a boolean',
        selected: 'hard',
      },
    ];

    expect(service.validate(validValues, attributes)).toEqual(validValues);
    expect(() => service.validate(invalidValues, attributes)).toThrow(
      BadRequestException,
    );
    expect(() => service.validate(invalidValues, attributes)).toThrow(
      `Value for attribute "Difficulty" must be a boolean`,
    );
  });

  it('should validate nested select attributes with non-value select options (number, string, boolean)', () => {
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
            type: AttributeType.Boolean,
          },
          {
            field: 'hard',
            name: 'Hard',
            type: AttributeType.Select,
            options: [
              {
                field: 'extreme',
                name: 'Extreme',
                type: AttributeType.Number,
              },
              {
                field: 'expert',
                name: 'Expert',
                type: AttributeType.String,
              },
            ],
          },
        ],
      },
    ];

    const validValues: AttributeValue[][] = [
      [{ field: 'difficulty', value: 'true', selected: 'med' }],
      [{ field: 'difficulty', value: 'easy', selected: 'easy' }],
      [{ field: 'difficulty', value: '12', selected: 'hard.extreme' }],
      [{ field: 'difficulty', value: 'some string', selected: 'hard.expert' }],
    ];

    const invalidValues: AttributeValue[] = [
      { field: 'difficulty', value: 'not-number', selected: 'hard.extreme' },
    ];

    for (const validValue of validValues)
      expect(service.validate(validValue, attributes)).toEqual(validValue);

    expect(() => service.validate(invalidValues, attributes)).toThrow(
      BadRequestException,
    );

    expect(() => service.validate(invalidValues, attributes)).toThrow(
      `Value for attribute "Difficulty" must be a number`,
    );
  });

  it('should not allow multiple values for non-multiselect attributes', () => {
    const attributes: Attribute[] = [
      {
        field: 'category',
        name: 'Category',
        type: AttributeType.Select,
        required: true,
        options: [
          { field: 'sports', name: 'Sports', type: AttributeType.Value },
          { field: 'music', name: 'Music', type: AttributeType.Value },
        ],
      },
    ];

    const invalidValues: AttributeValue[] = [
      { field: 'category', value: 'sports', selected: 'sports' },
      { field: 'category', value: 'music', selected: 'music' },
    ];

    expect(() => service.validate(invalidValues, attributes)).toThrow(
      BadRequestException,
    );

    expect(() => service.validate(invalidValues, attributes)).toThrow(
      `Attribute "Category cannot have multiple values`,
    );
  });

  it('should allow multiple values for multiselect attributes', () => {
    const attributes: Attribute[] = [
      {
        field: 'tags',
        name: 'Tags',
        type: AttributeType.Multiselect,
        required: true,
        options: [
          { field: 'science', name: 'Science', type: AttributeType.Value },
          { field: 'math', name: 'Math', type: AttributeType.Value },
          { field: 'history', name: 'History', type: AttributeType.Value },
        ],
      },
    ];

    const validValues: AttributeValue[] = [
      { field: 'tags', value: 'science', selected: 'science' },
      { field: 'tags', value: 'math', selected: 'math' },
    ];

    expect(service.validate(validValues, attributes)).toEqual(validValues);
  });

  it('should reject invalid options for multiselect attributes', () => {
    const attributes: Attribute[] = [
      {
        field: 'tags',
        name: 'Tags',
        type: AttributeType.Multiselect,
        required: true,
        options: [
          { field: 'science', name: 'Science', type: AttributeType.Value },
          { field: 'math', name: 'Math', type: AttributeType.Value },
        ],
      },
    ];

    const invalidValues: AttributeValue[] = [
      { field: 'tags', value: 'science', selected: 'science' },
      { field: 'tags', value: 'invalidTag', selected: 'invalidTag' },
    ];

    expect(() => service.validate(invalidValues, attributes)).toThrow(
      BadRequestException,
    );

    expect(() => service.validate(invalidValues, attributes)).toThrow(
      `Value "invalidTag" for attribute "Tags" is not a valid option`,
    );
  });

  it('should validate nested multiselect attributes correctly', () => {
    const attributes: Attribute[] = [
      {
        field: 'preferences',
        name: 'Preferences',
        type: AttributeType.Multiselect,
        required: true,
        options: [
          {
            field: 'food',
            name: 'Food',
            type: AttributeType.Select,
            options: [
              { field: 'vegan', name: 'Vegan', type: AttributeType.Value },
              { field: 'meat', name: 'Meat', type: AttributeType.Value },
            ],
          },
          {
            field: 'sports',
            name: 'Sports',
            type: AttributeType.Multiselect,
            options: [
              {
                field: 'football',
                name: 'Football',
                type: AttributeType.Value,
              },
              { field: 'tennis', name: 'Tennis', type: AttributeType.Value },
            ],
          },
        ],
      },
    ];

    const validValues: AttributeValue[] = [
      { field: 'preferences', value: 'vegan', selected: 'food.vegan' },
      { field: 'preferences', value: 'football', selected: 'sports.football' },
    ];

    const invalidValues: AttributeValue[] = [
      {
        field: 'preferences',
        value: 'basketball',
        selected: 'sports.basketball',
      },
    ];

    expect(service.validate(validValues, attributes)).toEqual(validValues);
    expect(() => service.validate(invalidValues, attributes)).toThrow(
      BadRequestException,
    );
    expect(() => service.validate(invalidValues, attributes)).toThrow(
      `Value "sports.basketball" for attribute "Preferences" is not a valid option`,
    );
  });
});
