import { BaseFilter } from '../../../shared/models';

export interface GisDataCategoryDto {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    orderNumber?: number;
    status?: number;
    keyWord?: string;
}

export const GIS_ICON_TYPES: { value: string; label: string; emoji: string; defaultColor: string }[] = [
    { value: 'default', label: 'Mặc định', emoji: '📍', defaultColor: '#1677ff' },
    { value: 'building', label: 'Tòa nhà', emoji: '🏢', defaultColor: '#595959' },
    { value: 'hospital', label: 'Bệnh viện', emoji: '🏥', defaultColor: '#f5222d' },
    { value: 'school', label: 'Trường học', emoji: '🏫', defaultColor: '#fa8c16' },
    { value: 'restaurant', label: 'Nhà hàng', emoji: '🍽️', defaultColor: '#d46b08' },
    { value: 'park', label: 'Công viên', emoji: '🌳', defaultColor: '#52c41a' },
    { value: 'shop', label: 'Cửa hàng', emoji: '🛒', defaultColor: '#722ed1' },
    { value: 'hotel', label: 'Khách sạn', emoji: '🏨', defaultColor: '#13c2c2' },
    { value: 'gas', label: 'Trạm xăng', emoji: '⛽', defaultColor: '#fa541c' },
    { value: 'airport', label: 'Sân bay', emoji: '✈️', defaultColor: '#1890ff' },
    { value: 'factory', label: 'Nhà máy', emoji: '🏭', defaultColor: '#8c8c8c' },
    { value: 'police', label: 'Công an', emoji: '🚔', defaultColor: '#003a8c' },
];

export function getIconDef(iconType?: string | null) {
    return GIS_ICON_TYPES.find(i => i.value === iconType) ?? GIS_ICON_TYPES[0];
}

export class GisLocationDto extends BaseFilter {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    category?: string;
    provinceCode?: string;
    communeCode?: string;
    codes?: string[];
    latitude?: number;
    longitude?: number;
    address?: string;
    status?: number;
    propertiesJson?: string;
    iconType?: string;
    color?: string;
    geometryType?: 'Point' | 'Polygon' | 'LineString' | 'MultiPolygon';
    polygonCoordinatesJson?: string;
    data?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
}

export interface GeoJsonPointGeometry {
    type: 'Point';
    coordinates: [number, number];
}

export interface GeoJsonPolygonGeometry {
    type: 'Polygon';
    coordinates: [number, number][][];
}

export interface GeoJsonLineStringGeometry {
    type: 'LineString';
    coordinates: [number, number][];
}

export interface GeoJsonMultiPolygonGeometry {
    type: 'MultiPolygon';
    coordinates: [number, number][][][];
}

export interface GeoJsonFeature {
    type: 'Feature';
    id?: string;
    geometry: GeoJsonPointGeometry | GeoJsonPolygonGeometry | GeoJsonLineStringGeometry | GeoJsonMultiPolygonGeometry;
    properties: { [key: string]: any };
}

export interface GeoJsonFeatureCollection {
    type: 'FeatureCollection';
    features: GeoJsonFeature[];
}

export interface HeatmapPoint {
    latitude: number;
    longitude: number;
    weight: number;
}
