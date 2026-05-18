export interface VillageOption {
  name: string;
  postalCode?: string;
}

export interface DistrictOption {
  name: string;
  villages: VillageOption[];
}

export interface CityOption {
  name: string;
  districts: DistrictOption[];
}

export interface ProvinceOption {
  name: string;
  cities: CityOption[];
}

export const locationOptions: ProvinceOption[] = [
  {
    name: 'Jawa Timur',
    cities: [
      {
        name: 'Surabaya',
        districts: [
          {
            name: 'Rungkut',
            villages: [
              { name: 'Rungkut Kidul', postalCode: '60293' },
              { name: 'Kedung Baruk', postalCode: '60298' },
              { name: 'Medokan Ayu', postalCode: '60295' },
            ],
          },
          {
            name: 'Wonokromo',
            villages: [
              { name: 'Darmo', postalCode: '60241' },
              { name: 'Jagir', postalCode: '60244' },
            ],
          },
        ],
      },
      {
        name: 'Malang',
        districts: [
          {
            name: 'Klojen',
            villages: [
              { name: 'Klojen', postalCode: '65111' },
              { name: 'Oro-oro Dowo', postalCode: '65119' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'DKI Jakarta',
    cities: [
      {
        name: 'Jakarta Selatan',
        districts: [
          {
            name: 'Kebayoran Baru',
            villages: [
              { name: 'Senayan', postalCode: '12190' },
              { name: 'Gandaria Utara', postalCode: '12140' },
            ],
          },
          {
            name: 'Cilandak',
            villages: [
              { name: 'Cilandak Barat', postalCode: '12430' },
              { name: 'Lebak Bulus', postalCode: '12440' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Jawa Barat',
    cities: [
      {
        name: 'Bandung',
        districts: [
          {
            name: 'Coblong',
            villages: [
              { name: 'Dago', postalCode: '40135' },
              { name: 'Lebakgede', postalCode: '40132' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'DI Yogyakarta',
    cities: [
      {
        name: 'Yogyakarta',
        districts: [
          {
            name: 'Gondokusuman',
            villages: [
              { name: 'Demangan', postalCode: '55221' },
              { name: 'Baciro', postalCode: '55225' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Bali',
    cities: [
      {
        name: 'Denpasar',
        districts: [
          {
            name: 'Denpasar Selatan',
            villages: [
              { name: 'Sanur', postalCode: '80228' },
              { name: 'Sesetan', postalCode: '80223' },
            ],
          },
        ],
      },
      {
        name: 'Badung',
        districts: [
          {
            name: 'Kuta',
            villages: [
              { name: 'Kuta', postalCode: '80361' },
              { name: 'Legian', postalCode: '80361' },
            ],
          },
        ],
      },
    ],
  },
];

export function findProvince(name: string) {
  return locationOptions.find((province) => province.name === name);
}

export function findCity(provinceName: string, cityName: string) {
  return findProvince(provinceName)?.cities.find((city) => city.name === cityName);
}

export function findDistrict(provinceName: string, cityName: string, districtName: string) {
  return findCity(provinceName, cityName)?.districts.find((district) => district.name === districtName);
}
