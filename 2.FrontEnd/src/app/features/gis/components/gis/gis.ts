import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonPolygonGeometry, GisDataCategoryDto, GisLocationDto, GIS_ICON_TYPES, getIconDef } from '../../models/gis-location.model';
import { GisService } from '../../services/gis.service';
import { sanitizeHtml } from '../../../../core/security/html-sanitize';
import maplibregl, { GeoJSONSource, LngLatLike, Map as MlMap, Marker, Popup } from 'maplibre-gl';
import { QuillModule } from 'ngx-quill';

@Component({
    selector: 'app-gis',
    standalone: true,
    imports: [SharedModules, QuillModule],
    templateUrl: './gis.html',
    styleUrl: './gis.scss'
})
export class Gis implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('importInput', { static: false }) importInput?: ElementRef<HTMLInputElement>;
    private destroy$ = new Subject<void>();
    private map!: MlMap;
    private markers: Marker[] = [];

    readonly defaultCenter: [number, number] = [105.8342, 21.0278];
    readonly defaultZoom = 12;
    readonly iconTypes = GIS_ICON_TYPES;

    readonly basemaps: Record<string, { label: string; tiles: string[]; attribution: string }> = {
        osm: {
            label: 'OpenStreetMap',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        satellite: {
            label: 'Satellite',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            attribution: 'Tiles © Esri'
        },
        topo: {
            label: 'Topo',
            tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
            attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>'
        }
    };
    selectedBasemap = 'osm';

    readonly mapStyle: maplibregl.StyleSpecification = {
        version: 8,
        sources: {
            basemap: {
                type: 'raster',
                tiles: this.basemaps['osm'].tiles,
                tileSize: 256,
                attribution: this.basemaps['osm'].attribution
            }
        },
        layers: [{
            id: 'basemap',
            type: 'raster',
            source: 'basemap'
        }]
    };

    filter: GisLocationDto = new GisLocationDto();
    list: GisLocationDto[] = [];
    total = 0;
    categories: GisDataCategoryDto[] = [];

    isCategoryModalVisible = false;
    categoryList: GisDataCategoryDto[] = [];
    categoryTotal = 0;
    categoryFilter: GisDataCategoryDto = {};
    categoryLoading = false;
    isCategoryEdit = false;
    categoryDto: GisDataCategoryDto = {};
    isCategoryFormVisible = false;

    clusterEnabled = false;
    heatmapEnabled = false;
    addMode = false;
    drawPolygonMode = false;
    drawLineMode = false;
    measureMode: 'distance' | 'area' | null = null;
    isLegendVisible = false;
    importing = false;

    drawingPoints: [number, number][] = [];
    private drawDotMarkers: Marker[] = [];

    measurePoints: [number, number][] = [];
    measureResult = '';
    private measureMarkers: Marker[] = [];

    readonly statusOptions = [
        { value: 1, label: 'Hoạt động' },
        { value: 0, label: 'Không hoạt động' }
    ];

    isModalVisible = false;
    isEdit = false;
    dto: GisLocationDto = new GisLocationDto();

    isPopupVisible = false;
    popupItem: GisLocationDto | null = null;

    hoverItem: GisLocationDto | null = null;
    hoverPos: { x: number; y: number } = { x: 0, y: 0 };

    isListModalVisible = false;
    private listLoaded = false;

    readonly quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ header: [1, 2, 3, false] }],
            ['link', 'image'],
            ['clean']
        ]
    };

    loading = false;

    // Bộ lọc hành chính
    provinces: GisLocationDto[] = [];
    allCommunes: GisLocationDto[] = [];
    filteredCommunes: GisLocationDto[] = [];
    private readonly provinceCategoryNames = ['Tỉnh', 'Tỉnh/Thành', 'Tỉnh/Thành phố'];
    private readonly communeCategoryNames = ['Xã', 'Phường', 'Xã/Phường', 'Thị trấn'];
    private readonly communeBoundaryMinZoom = 9.5;
    private readonly polygonFillLayerIds = ['commune-polygon-fill', 'polygon-fill', 'province-polygon-fill'];
    private polygonInteractionsBound = false;

    // Trạng thái Import GeoJSON nâng cao
    isImportModalVisible = false;
    importFileName = '';
    importedFeatures: any[] = [];
    geoJsonPropsKeys: string[] = [];
    importMapping = {
        category: 'AUTO',
        color: '#1677ff',
        nameField: 'name',
        codeField: 'code',
        parentField: 'parent_code'
    };
    importProgress = {
        active: false,
        current: 0,
        total: 0,
        percent: 0
    };
    importDuplicateErrors: { code: string; name: string; message: string }[] = [];

    constructor(
        private global: GlobalService,
        private service: GisService,
        private message: NzMessageService,
        private modal: NzModalService,
    ) {
        this.global.setBreadcrumb([{ name: 'Bản đồ GIS', path: 'gis' }]);
        this.filter.pageSize = 20;
    }

    ngOnInit(): void {
        this.loadCategories();
        this.loadAdministrativeFilters();
    }

    ngAfterViewInit(): void {
        this.initMap();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.map?.remove();
    }

    private initMap() {
        this.map = new maplibregl.Map({
            container: this.mapContainer.nativeElement,
            style: this.mapStyle,
            center: this.defaultCenter,
            zoom: this.defaultZoom,
        } as any);
        this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
        this.map.addControl(new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true
        }));

        this.map.on('load', () => {
            this.locateUser();
            this.refreshMap();
        });

        this.map.on('click', (e) => {
            if (this.measureMode) {
                this.addMeasurePoint(e.lngLat.lng, e.lngLat.lat);
            } else if (this.addMode) {
                this.openCreate(e.lngLat.lng, e.lngLat.lat);
            } else if (this.drawPolygonMode) {
                this.addPolygonPoint(e.lngLat.lng, e.lngLat.lat);
            } else if (this.drawLineMode) {
                this.addLinePoint(e.lngLat.lng, e.lngLat.lat);
            }
        });

        this.map.on('dblclick', (e) => {
            if (this.drawPolygonMode && this.drawingPoints.length >= 3) {
                e.preventDefault();
                this.finishPolygon();
            } else if (this.drawLineMode && this.drawingPoints.length >= 2) {
                e.preventDefault();
                this.finishLine();
            }
        });
    }

    private locateUser() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            pos => this.map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude] as LngLatLike, zoom: this.defaultZoom }),
            () => this.map.flyTo({ center: this.defaultCenter, zoom: this.defaultZoom }),
            { enableHighAccuracy: true, timeout: 6000 }
        );
    }

    loadCategories() {
        this.service.categoryGetAll().pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: any) => { this.categories = res || []; }
        });
    }

    // Tải danh sách Tỉnh, Xã phục vụ bộ lọc
    loadAdministrativeFilters() {
        this.searchByCategories(this.provinceCategoryNames).pipe(takeUntil(this.destroy$)).subscribe({
            next: (responses: any[]) => {
                this.provinces = this.uniqueLocations(responses.flatMap(r => r?.data || []))
                    .filter(item => this.isProvinceLevel(item))
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));

                if (this.filter.provinceCode && !this.provinces.some(p => p.code === this.filter.provinceCode)) {
                    this.filter.provinceCode = undefined;
                }
                this.syncFilteredCommunes();
            }
        });

        this.searchByCategories(this.communeCategoryNames).pipe(takeUntil(this.destroy$)).subscribe({
            next: (responses: any[]) => {
                this.allCommunes = this.uniqueLocations(responses.flatMap(r => r?.data || []))
                    .filter(item => this.isCommuneLevel(item))
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
                this.syncFilteredCommunes();
            }
        });
    }

    onProvinceChange(provinceCode: string | null) {
        this.filter.communeCode = undefined;
        this.syncFilteredCommunes();

        if (provinceCode) {
            const selectedProvince = this.provinces.find(p => p.code === provinceCode);
            if (selectedProvince) {
                this.zoomToFeature(selectedProvince);
            }
        }
        this.onSearch();
    }

    onCommuneChange(communeCode: string | null) {
        if (communeCode) {
            const selectedCommune = this.allCommunes.find(c => c.code === communeCode);
            if (selectedCommune) {
                this.zoomToFeature(selectedCommune);
            }
        }
        this.onSearch();
    }

    private searchByCategories(categoryNames: string[]) {
        return forkJoin(categoryNames.map(category => {
            const filter = new GisLocationDto();
            filter.category = category;
            filter.pageSize = 10000;
            return this.service.search(filter);
        }));
    }

    private syncFilteredCommunes() {
        if (!this.filter.provinceCode) {
            this.filteredCommunes = [];
            this.filter.communeCode = undefined;
            return;
        }

        this.filteredCommunes = this.allCommunes.filter(c => this.getParentCode(c) === this.filter.provinceCode);
        if (this.filter.communeCode && !this.filteredCommunes.some(c => c.code === this.filter.communeCode)) {
            this.filter.communeCode = undefined;
        }
    }

    private uniqueLocations(items: GisLocationDto[]) {
        const map = new Map<string, GisLocationDto>();
        items.forEach(item => {
            const key = item.code || item.id;
            if (key && !map.has(key)) map.set(key, item);
        });
        return Array.from(map.values());
    }

    private isProvinceLevel(item: GisLocationDto) {
        return !!item.code && this.isProvinceCategory(item.category) && !this.getParentCode(item) && !this.getCommuneCode(item);
    }

    private isCommuneLevel(item: GisLocationDto) {
        return !!item.code && this.isCommuneCategory(item.category) && !!this.getParentCode(item);
    }

    private isProvinceCategory(category?: string | null) {
        return this.provinceCategoryNames.some(name => this.sameCategory(name, category));
    }

    private isCommuneCategory(category?: string | null) {
        return this.communeCategoryNames.some(name => this.sameCategory(name, category));
    }

    private sameCategory(a?: string | null, b?: string | null) {
        return (a || '').trim().toLocaleLowerCase('vi') === (b || '').trim().toLocaleLowerCase('vi');
    }

    private getParentCode(item: GisLocationDto) {
        const props = this.parseProperties(item.propertiesJson);
        const explicitParent = this.toStringValue(
            props['parentCode'] ||
            props['provinceCode'] ||
            props['parent_code'] ||
            props['ma_cha'] ||
            props['province_code']
        );
        if (explicitParent) return explicitParent;

        const provinceCode = this.toStringValue(props['ma_tinh']);
        return provinceCode && provinceCode !== item.code ? provinceCode : '';
    }

    private getCommuneCode(item: GisLocationDto) {
        const props = this.parseProperties(item.propertiesJson);
        return this.toStringValue(props['communeCode'] || props['commune_code'] || props['ma_xa']);
    }

    private parseProperties(propertiesJson?: string | null): Record<string, any> {
        if (!propertiesJson) return {};
        try {
            const parsed = JSON.parse(propertiesJson);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }

    private toStringValue(value: any) {
        return value == null || value === '' ? '' : String(value);
    }

    private zoomToFeature(item: GisLocationDto) {
        if ((item.geometryType === 'Polygon' || item.geometryType === 'MultiPolygon') && item.polygonCoordinatesJson) {
            try {
                const coordinates = JSON.parse(item.polygonCoordinatesJson);
                const bounds = new maplibregl.LngLatBounds();
                
                if (item.geometryType === 'MultiPolygon') {
                    coordinates.forEach((polygon: any) => {
                        const ring = polygon[0] || [];
                        ring.forEach((coord: [number, number]) => {
                            bounds.extend(coord);
                        });
                    });
                } else {
                    const ring = coordinates[0] || [];
                    ring.forEach((coord: [number, number]) => {
                        bounds.extend(coord);
                    });
                }
                this.map.fitBounds(bounds, { padding: 40, maxZoom: 16, duration: 1200 });
            } catch {
                if (item.longitude && item.latitude) {
                    this.map.flyTo({ center: [+item.longitude, +item.latitude] as LngLatLike, zoom: 15, duration: 1200 });
                }
            }
        } else if (item.longitude && item.latitude) {
            this.map.flyTo({ center: [+item.longitude, +item.latitude] as LngLatLike, zoom: 15, duration: 1200 });
        }
    }

    openImportModal() {
        this.isImportModalVisible = true;
        this.resetImportState();
    }

    resetImportState() {
        this.importedFeatures = [];
        this.geoJsonPropsKeys = [];
        this.importFileName = '';
        this.importMapping = {
            category: 'AUTO',
            color: '#1677ff',
            nameField: 'name',
            codeField: 'code',
            parentField: 'parent_code'
        };
        this.importProgress = { active: false, current: 0, total: 0, percent: 0 };
        this.importDuplicateErrors = [];
    }

    beforeUploadGeoJson = (file: any): boolean => {
        this.importFileName = file.name;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                const features: any[] = parsed?.type === 'FeatureCollection' ? (parsed.features || [])
                    : parsed?.type === 'Feature' ? [parsed] : [];
                
                if (!features.length) {
                    this.message.warning('Không tìm thấy thực thể địa lý nào');
                    return;
                }
                
                this.importedFeatures = features;
                const firstProps = features[0]?.properties || {};
                this.geoJsonPropsKeys = Object.keys(firstProps);

                const findMatchKey = (possibilities: string[], fallbackToFirst = true): string => {
                    const matched = this.geoJsonPropsKeys.find(k => possibilities.includes(k.toLowerCase()));
                    return matched || (fallbackToFirst ? this.geoJsonPropsKeys[0] || '' : '');
                };

                this.importMapping.nameField = findMatchKey(['name', 'ten', 'ten_tinh', 'ten_xa', 'title', 'label']);
                this.importMapping.codeField = findMatchKey(['code', 'ma', 'ma_tinh', 'ma_xa', 'id', 'key']);
                const explicitParentField = findMatchKey(['parent_code', 'ma_cha', 'province_code'], false);
                const mappedFields = this.normalizeText(`${this.importMapping.nameField} ${this.importMapping.codeField}`);
                const provinceParentField = findMatchKey(['ma_tinh'], false);
                this.importMapping.parentField = explicitParentField ||
                    (mappedFields.includes('xa') || mappedFields.includes('phuong') || mappedFields.includes('thi tran') ? provinceParentField : '');
            } catch {
                this.message.error('File không hợp lệ hoặc lỗi định dạng JSON');
            }
        };
        reader.readAsText(file);
        return false;
    };

    get previewMappedData(): any {
        if (!this.importedFeatures.length) return null;
        return this.parseSingleFeatureToDto(this.importedFeatures[0]);
    }

    getParentCodeFromProperties(propertiesJsonStr?: string | null, ownCode?: string | null): string {
        if (!propertiesJsonStr) return '';
        try {
            const props = JSON.parse(propertiesJsonStr);
            const explicitParent = props.parentCode || props.provinceCode || props.parent_code || props.ma_cha || props.province_code || '';
            if (explicitParent) return explicitParent;

            const provinceCode = this.toStringValue(props.ma_tinh);
            return provinceCode && provinceCode !== ownCode ? provinceCode : '';
        } catch {
            return '';
        }
    }

    private resolveImportCategory(rawProps: Record<string, any>) {
        if (this.importMapping.category && this.importMapping.category !== 'AUTO') {
            return this.importMapping.category;
        }
        return this.detectImportCategory(rawProps);
    }

    private detectImportCategory(rawProps: Record<string, any>) {
        const explicitCategory = this.mapImportCategory(rawProps['category'] || rawProps['type'] || rawProps['loai'] || rawProps['cap'] || rawProps['level'] || rawProps['admin_level']);
        if (explicitCategory) return explicitCategory;

        const parentCode = this.readParentCodeFromRawProps(rawProps);
        const mappedFields = this.normalizeText(`${this.importMapping.nameField} ${this.importMapping.codeField}`);
        if (mappedFields.includes('xa') || mappedFields.includes('phuong') || mappedFields.includes('thi tran')) {
            return 'Xã';
        }
        if (parentCode) {
            return 'Xã';
        }
        if (mappedFields.includes('tinh')) {
            return 'Tỉnh';
        }

        return undefined;
    }

    private mapImportCategory(value: any) {
        const normalized = this.normalizeText(value);
        if (!normalized) return undefined;

        if (normalized === 'tinh' || normalized.includes('province')) {
            return 'Tỉnh';
        }
        if (normalized === 'xa' || normalized === 'phuong' || normalized === 'thi tran' ||
            normalized.includes('commune') || normalized.includes('ward')) {
            return 'Xã';
        }

        const provinceMatch = this.provinceCategoryNames.find(category => this.normalizeText(category) === normalized);
        if (provinceMatch) return 'Tỉnh';

        const communeMatch = this.communeCategoryNames.find(category => this.normalizeText(category) === normalized);
        if (communeMatch) return 'Xã';

        return undefined;
    }

    private readParentCodeFromRawProps(rawProps: Record<string, any>) {
        const mappedParent = this.importMapping.parentField && this.importMapping.parentField !== this.importMapping.codeField
            ? rawProps[this.importMapping.parentField]
            : undefined;
        const explicitParent = this.toStringValue(
            mappedParent ||
            rawProps['parentCode'] ||
            rawProps['provinceCode'] ||
            rawProps['parent_code'] ||
            rawProps['ma_cha'] ||
            rawProps['province_code']
        );
        if (explicitParent) return explicitParent;

        const code = this.importMapping.codeField ? this.toStringValue(rawProps[this.importMapping.codeField]) : '';
        const provinceCode = this.toStringValue(rawProps['ma_tinh']);
        return provinceCode && provinceCode !== code ? provinceCode : '';
    }

    private normalizeText(value: any) {
        return this.toStringValue(value)
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('vi');
    }

    private getImportValidationError() {
        for (const feature of this.importedFeatures) {
            const rawProps = feature?.properties || {};
            const category = this.resolveImportCategory(rawProps);
            const parentCode = this.readParentCodeFromRawProps(rawProps);

            if (!category) {
                return 'Chưa xác định được danh mục import. Hãy chọn Danh mục đích hoặc ánh xạ trường mã/tên có ma_tinh/ma_xa.';
            }
            if (this.isProvinceCategory(category) && parentCode) {
                return 'Dữ liệu Tỉnh/Thành phố không được có Mã cha. Hãy chọn đúng danh mục Xã/Phường hoặc bỏ ánh xạ Mã cha.';
            }
            if (this.isCommuneCategory(category) && !parentCode) {
                return 'Dữ liệu Xã/Phường cần có Mã cha/Mã tỉnh để lọc theo Tỉnh.';
            }
        }

        return null;
    }

    private parseSingleFeatureToDto(f: any): GisLocationDto | null {
        if (!f?.geometry) return null;
        const dto = new GisLocationDto();
        const rawProps = f.properties || {};

        dto.name = rawProps[this.importMapping.nameField] || 'Chưa đặt tên';
        dto.code = rawProps[this.importMapping.codeField] ? String(rawProps[this.importMapping.codeField]) : undefined;
        dto.category = this.resolveImportCategory(rawProps);
        
        dto.color = rawProps['color'] || this.importMapping.color;
        dto.status = 1;

        const dynamicProperties: Record<string, any> = { ...rawProps };
        const parentCode = this.readParentCodeFromRawProps(rawProps);
        if (parentCode) {
            dynamicProperties['parentCode'] = parentCode;
        }
        dto.propertiesJson = JSON.stringify(dynamicProperties);

        const g = f.geometry;
        if (g.type === 'Point' && Array.isArray(g.coordinates)) {
            dto.geometryType = 'Point';
            dto.longitude = g.coordinates[0];
            dto.latitude = g.coordinates[1];
        } else if (g.type === 'Polygon' && Array.isArray(g.coordinates)) {
            dto.geometryType = 'Polygon';
            dto.polygonCoordinatesJson = JSON.stringify(g.coordinates);
            
            const ring = g.coordinates[0] || [];
            if (ring.length) {
                dto.longitude = ring.reduce((s: number, p: number[]) => s + p[0], 0) / ring.length;
                dto.latitude = ring.reduce((s: number, p: number[]) => s + p[1], 0) / ring.length;
            }
        } else if (g.type === 'MultiPolygon' && Array.isArray(g.coordinates)) {
            dto.geometryType = 'MultiPolygon';
            dto.polygonCoordinatesJson = JSON.stringify(g.coordinates);
            
            const firstPoly = g.coordinates[0] || [];
            const ring = firstPoly[0] || [];
            if (ring.length) {
                dto.longitude = ring.reduce((s: number, p: number[]) => s + p[0], 0) / ring.length;
                dto.latitude = ring.reduce((s: number, p: number[]) => s + p[1], 0) / ring.length;
            }
        } else if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
            dto.geometryType = 'LineString';
            dto.polygonCoordinatesJson = JSON.stringify(g.coordinates);
            dto.longitude = g.coordinates[0][0];
            dto.latitude = g.coordinates[0][1];
        } else {
            return null;
        }

        return dto;
    }

    startSavingImport() {
        if (!this.importedFeatures.length) return;

        const validationError = this.getImportValidationError();
        if (validationError) {
            this.message.warning(validationError);
            return;
        }

        const codes = this.importedFeatures
            .map(f => this.parseSingleFeatureToDto(f)?.code)
            .filter(c => !!c) as string[];

        if (codes.length > 0) {
            this.importProgress.active = true;
            const checkFilter = new GisLocationDto();
            checkFilter.codes = codes;
            checkFilter.pageSize = 10000;
            this.service.searchSilent(checkFilter).pipe(takeUntil(this.destroy$)).subscribe({
                next: (res: any) => {
                    const existingData = res?.data || [];
                    if (existingData.length > 0) {
                        this.importProgress.active = false;
                        this.modal.confirm({
                            nzTitle: 'Phát hiện dữ liệu trùng lặp',
                            nzContent: `Có ${existingData.length} thực thể đã tồn tại trong hệ thống. Bạn có muốn xóa các thực thể cũ và tiếp tục import đè lên không?`,
                            nzOkText: 'Xóa và Import',
                            nzOkDanger: true,
                            nzOnOk: () => {
                                this.importProgress.active = true;
                                const deleteReqs = existingData.map((e: any) => this.service.delete(e.id));
                                forkJoin(deleteReqs).pipe(takeUntil(this.destroy$)).subscribe({
                                    next: () => {
                                        this.executeImportSaving();
                                    },
                                    error: () => {
                                        this.importProgress.active = false;
                                        this.message.error('Lỗi khi xóa dữ liệu cũ.');
                                    }
                                });
                            },
                            nzCancelText: 'Hủy bỏ',
                            nzOnCancel: () => {
                                this.importProgress.active = false;
                            }
                        });
                    } else {
                        this.executeImportSaving();
                    }
                },
                error: () => {
                    this.importProgress.active = false;
                    this.message.error('Lỗi kiểm tra dữ liệu trùng lặp.');
                }
            });
        } else {
            this.executeImportSaving();
        }
    }

    private executeImportSaving() {
        this.importProgress.active = true;
        this.importProgress.total = this.importedFeatures.length;
        this.importProgress.current = 0;
        this.importProgress.percent = 0;
        this.importDuplicateErrors = [];

        let success = 0;
        const total = this.importedFeatures.length;
        
        const saveNext = () => {
            if (this.importProgress.current >= total) {
                this.importProgress.active = false;
                if (success > 0) {
                    if (this.importDuplicateErrors.length > 0) {
                        this.message.warning(
                            `Import hoàn tất: ${success}/${total} thành công, ${this.importDuplicateErrors.length} bị trùng mã đã tồn tại.`
                        );
                    } else {
                        this.message.success(`Đã import thành công ${success}/${total} thực thể bản đồ.`);
                        this.isImportModalVisible = false;
                    }
                } else {
                    if (this.importDuplicateErrors.length > 0) {
                        this.message.warning(
                            `Import không thành công: ${this.importDuplicateErrors.length}/${total} thực thể bị trùng mã đã tồn tại.`
                        );
                    } else {
                        this.message.error('Import không thành công. Vui lòng kiểm tra lại dữ liệu.');
                    }
                }
                this.refreshMap();
                this.loadAdministrativeFilters();
                return;
            }

            const currentFeature = this.importedFeatures[this.importProgress.current];
            const dto = this.parseSingleFeatureToDto(currentFeature);
            
            this.importProgress.current++;
            this.importProgress.percent = Math.round((this.importProgress.current / total) * 100);

            if (!dto || !dto.category) {
                saveNext();
                return;
            }

            this.service.create(dto).pipe(takeUntil(this.destroy$)).subscribe({
                next: (res: any) => {
                    if (res?.status !== false) {
                        success++;
                    } else {
                        const errMsg = res?.messageObject?.message || res?.messageObject?.messageDetail || 'Lỗi không xác định';
                        if (errMsg.includes('đã tồn tại')) {
                            this.importDuplicateErrors.push({
                                code: dto.code || '',
                                name: dto.name || '',
                                message: errMsg
                            });
                        }
                    }
                    saveNext();
                },
                error: () => {
                    saveNext();
                }
            });
        };

        saveNext();
    }

    openCategoryModal() {
        this.isCategoryModalVisible = true;
        this.loadCategoryList();
    }

    loadCategoryList() {
        this.categoryLoading = true;
        this.service.categorySearch(this.categoryFilter).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: any) => {
                this.categoryList = res?.data || [];
                this.categoryTotal = res?.totalRecord || 0;
                this.categoryLoading = false;
            },
            error: () => { this.categoryLoading = false; }
        });
    }

    openCreateCategory() {
        this.isCategoryEdit = false;
        this.categoryDto = { status: 1, orderNumber: 0 };
        this.isCategoryFormVisible = true;
    }

    openEditCategory(item: GisDataCategoryDto) {
        this.isCategoryEdit = true;
        this.categoryDto = { ...item };
        this.isCategoryFormVisible = true;
    }

    saveCategory() {
        if (!this.categoryDto.name) { this.message.warning('Vui lòng nhập tên'); return; }
        const req$ = this.isCategoryEdit ? this.service.categoryUpdate(this.categoryDto) : this.service.categoryCreate(this.categoryDto);
        req$.pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: any) => {
                if (res?.status === false) { this.message.error(res?.messageObject?.message || 'Lỗi'); return; }
                this.isCategoryFormVisible = false;
                this.loadCategoryList();
                this.loadCategories();
            }
        });
    }

    deleteCategory(item: GisDataCategoryDto) {
        this.modal.confirm({
            nzTitle: 'Xác nhận xoá?',
            nzContent: `Xoá danh mục "${item.name}"?`,
            nzOkDanger: true,
            nzOnOk: () => {
                this.service.categoryDelete(item.id!).pipe(takeUntil(this.destroy$)).subscribe({
                    next: () => { this.message.success('Đã xoá'); this.loadCategoryList(); this.loadCategories(); }
                });
            }
        });
    }

    openListModal() {
        this.isListModalVisible = true;
        if (!this.listLoaded) {
            this.loadList();
        }
    }

    loadList() {
        this.loading = true;
        this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: any) => {
                this.list = res?.data || [];
                this.total = res?.totalRecord || 0;
                this.loading = false;
                this.listLoaded = true;
            },
            error: () => { this.loading = false; }
        });
    }

    refreshMap() {
        if (!this.map || !this.map.isStyleLoaded()) {
            this.map?.once('load', () => this.refreshMap());
            return;
        }
        this.removeMarkers();
        this.removeClusterLayers();
        this.removeHeatmapLayers();
        this.removePolygonLayers();
        this.removeLineLayers();

        const params: GisLocationDto = { ...this.filter, pageSize: 100000 } as any;
        this.service.geoJson(params).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: any) => {
                const fc: GeoJsonFeatureCollection = res || { type: 'FeatureCollection', features: [] };
                if (this.clusterEnabled) this.renderCluster(fc);
                else this.renderMarkers(fc);
                if (this.heatmapEnabled) this.renderHeatmap(fc);
            }
        });
    }

    private removeMarkers() {
        this.markers.forEach(m => m.remove());
        this.markers = [];
    }

    private removeClusterLayers() {
        ['clusters', 'cluster-count', 'unclustered-point'].forEach(id => {
            if (this.map.getLayer(id)) this.map.removeLayer(id);
        });
        if (this.map.getSource('gis-source')) this.map.removeSource('gis-source');
    }

    private removeHeatmapLayers() {
        if (this.map.getLayer('gis-heatmap')) this.map.removeLayer('gis-heatmap');
        if (this.map.getSource('gis-heatmap-source')) this.map.removeSource('gis-heatmap-source');
    }

    private removePolygonLayers() {
        [
            'province-polygon-fill',
            'province-polygon-outline',
            'commune-polygon-fill',
            'commune-polygon-outline',
            'polygon-fill',
            'polygon-outline'
        ].forEach(id => {
            if (this.map.getLayer(id)) this.map.removeLayer(id);
        });
        if (this.map.getSource('province-polygon-source')) this.map.removeSource('province-polygon-source');
        if (this.map.getSource('commune-polygon-source')) this.map.removeSource('commune-polygon-source');
        if (this.map.getSource('polygon-source')) this.map.removeSource('polygon-source');
    }

    private removeLineLayers() {
        if (this.map.getLayer('line-stroke')) this.map.removeLayer('line-stroke');
        if (this.map.getSource('line-source')) this.map.removeSource('line-source');
    }

    private renderMarkers(fc: GeoJsonFeatureCollection) {
        const pointFeatures = fc.features.filter(f => f.geometry.type === 'Point');
        const polygonFeatures = fc.features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
        const lineFeatures = fc.features.filter(f => f.geometry.type === 'LineString');

        pointFeatures.forEach(f => {
            const geo = f.geometry as { type: 'Point'; coordinates: [number, number] };
            const [lng, lat] = geo.coordinates;
            const props = f.properties;
            const iconDef = getIconDef(props?.['iconType']);
            const color = props?.['color'] || iconDef.defaultColor;

            const el = document.createElement('div');
            el.className = 'gis-marker';
            el.style.setProperty('--marker-color', color);
            el.setAttribute('title', props?.['name'] || '');
            // Build marker content with DOM APIs — avoids innerHTML for Trusted Types compliance.
            const iconSpan = document.createElement('span');
            iconSpan.className = 'gis-marker-icon';
            iconSpan.textContent = iconDef.emoji;  // emoji is a plain string, textContent is safe.
            el.appendChild(iconSpan);

            const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
                .setLngLat([lng, lat])
                .addTo(this.map);
            el.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.openEdit(f.properties as any);
            });
            el.addEventListener('mouseenter', (ev) => {
                const rect = this.mapContainer.nativeElement.getBoundingClientRect();
                this.showHover(f.properties, ev.clientX - rect.left, ev.clientY - rect.top);
            });
            el.addEventListener('mousemove', (ev) => {
                const rect = this.mapContainer.nativeElement.getBoundingClientRect();
                this.hoverPos = { x: ev.clientX - rect.left + 14, y: ev.clientY - rect.top + 14 };
            });
            el.addEventListener('mouseleave', () => this.hideHover());
            this.markers.push(marker);
        });

        if (polygonFeatures.length > 0) {
            this.renderPolygons(polygonFeatures);
        }

        if (lineFeatures.length > 0) {
            this.renderLines(lineFeatures);
        }
    }

    private renderCluster(fc: GeoJsonFeatureCollection) {
        const pointFc = { ...fc, features: fc.features.filter(f => f.geometry.type === 'Point') };
        const polygonFeatures = fc.features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
        const lineFeatures = fc.features.filter(f => f.geometry.type === 'LineString');

        this.map.addSource('gis-source', {
            type: 'geojson',
            data: pointFc as any,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });
        this.map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'gis-source',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
                'circle-radius': ['step', ['get', 'point_count'], 18, 100, 24, 750, 30]
            }
        });
        this.map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'gis-source',
            filter: ['has', 'point_count'],
            layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 }
        });
        this.map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'gis-source',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#11b4da',
                'circle-radius': 7,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });
        this.map.on('click', 'clusters', (e) => {
            const features = this.map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            const clusterId = features[0].properties?.['cluster_id'];
            const src = this.map.getSource('gis-source') as GeoJSONSource;
            src.getClusterExpansionZoom(clusterId).then(zoom => {
                this.map.easeTo({ center: (features[0].geometry as any).coordinates, zoom });
            });
        });
        this.map.on('click', 'unclustered-point', (e) => {
            const props = e.features?.[0]?.properties as any;
            if (props) this.openEdit(props);
        });

        if (polygonFeatures.length > 0) {
            this.renderPolygons(polygonFeatures);
        }
        if (lineFeatures.length > 0) {
            this.renderLines(lineFeatures);
        }
    }

    private renderLines(features: GeoJsonFeature[]) {
        const fc = { type: 'FeatureCollection', features };
        this.map.addSource('line-source', { type: 'geojson', data: fc as any });
        this.map.addLayer({
            id: 'line-stroke',
            type: 'line',
            source: 'line-source',
            paint: {
                'line-color': ['coalesce', ['get', 'color'], '#1677ff'],
                'line-width': 3
            }
        });
        this.map.on('click', 'line-stroke', (e) => {
            e.preventDefault();
            const props = e.features?.[0]?.properties as any;
            if (props) this.openEdit(props);
        });
        this.map.on('mouseenter', 'line-stroke', (e) => {
            this.map.getCanvas().style.cursor = 'pointer';
            const props = e.features?.[0]?.properties as any;
            if (props) this.showHover(props, e.point.x, e.point.y);
        });
        this.map.on('mousemove', 'line-stroke', (e) => {
            if (this.hoverItem) this.hoverPos = { x: e.point.x + 14, y: e.point.y + 14 };
        });
        this.map.on('mouseleave', 'line-stroke', () => {
            this.map.getCanvas().style.cursor = this.isAnyDrawMode() ? 'crosshair' : '';
            this.hideHover();
        });
    }

    private renderHeatmap(fc: GeoJsonFeatureCollection) {
        this.map.addSource('gis-heatmap-source', { type: 'geojson', data: fc as any });
        this.map.addLayer({
            id: 'gis-heatmap',
            type: 'heatmap',
            source: 'gis-heatmap-source',
            paint: {
                'heatmap-weight': 1,
                'heatmap-intensity': 1,
                'heatmap-radius': 30,
                'heatmap-opacity': 0.7
            }
        }, 'clusters');
    }

    private renderPolygons(features: GeoJsonFeature[]) {
        const provinceFeatures = features.filter(f => this.isProvinceBoundaryFeature(f));
        const communeFeatures = features.filter(f => this.isCommuneBoundaryFeature(f));
        const otherFeatures = features.filter(f => !this.isProvinceBoundaryFeature(f) && !this.isCommuneBoundaryFeature(f));

        if (provinceFeatures.length) {
            this.addPolygonSourceAndLayers({
                sourceId: 'province-polygon-source',
                fillId: 'province-polygon-fill',
                outlineId: 'province-polygon-outline',
                features: provinceFeatures,
                fillOpacity: 0.10,
                lineWidth: 3,
                fallbackColor: '#00ffff'
            });
        }

        if (otherFeatures.length) {
            this.addPolygonSourceAndLayers({
                sourceId: 'polygon-source',
                fillId: 'polygon-fill',
                outlineId: 'polygon-outline',
                features: otherFeatures,
                fillOpacity: 0.18,
                lineWidth: 2.5,
                fallbackColor: '#1677ff'
            });
        }

        if (communeFeatures.length) {
            this.addPolygonSourceAndLayers({
                sourceId: 'commune-polygon-source',
                fillId: 'commune-polygon-fill',
                outlineId: 'commune-polygon-outline',
                features: communeFeatures,
                minzoom: this.communeBoundaryMinZoom,
                fillOpacity: 0.08,
                lineWidth: 2.2,
                fallbackColor: '#52c41a'
            });
        }

        if (this.map.getLayer('province-polygon-outline')) {
            this.map.moveLayer('province-polygon-outline');
        }
    }

    private addPolygonSourceAndLayers(options: {
        sourceId: string;
        fillId: string;
        outlineId: string;
        features: GeoJsonFeature[];
        minzoom?: number;
        fillOpacity: number;
        lineWidth: number;
        fallbackColor: string;
    }) {
        const fc = { type: 'FeatureCollection', features: options.features };
        this.map.addSource(options.sourceId, { type: 'geojson', data: fc as any });
        this.map.addLayer({
            id: options.fillId,
            type: 'fill',
            source: options.sourceId,
            minzoom: options.minzoom,
            paint: {
                'fill-color': ['coalesce', ['get', 'color'], options.fallbackColor],
                'fill-opacity': options.fillOpacity
            }
        });
        this.map.addLayer({
            id: options.outlineId,
            type: 'line',
            source: options.sourceId,
            minzoom: options.minzoom,
            paint: {
                'line-color': ['coalesce', ['get', 'color'], options.fallbackColor],
                'line-width': options.lineWidth
            }
        });
        this.bindPolygonInteractions();
    }

    private bindPolygonInteractions() {
        if (this.polygonInteractionsBound) return;
        this.polygonInteractionsBound = true;

        this.map.on('click', (e) => {
            if (this.isAnyDrawMode()) return;
            const props = this.getTopPolygonProperties(e.point);
            if (!props) return;
            e.preventDefault();
            this.openEdit(props);
        });

        this.map.on('mousemove', (e) => {
            if (this.isAnyDrawMode()) return;
            const props = this.getTopPolygonProperties(e.point);
            if (!props) {
                if (this.hoverItem?.geometryType === 'Polygon' || this.hoverItem?.geometryType === 'MultiPolygon') {
                    this.hideHover();
                }
                this.map.getCanvas().style.cursor = this.isAnyDrawMode() ? 'crosshair' : '';
                return;
            }

            this.map.getCanvas().style.cursor = 'pointer';
            if (!this.hoverItem || this.hoverItem.id !== props['id']) {
                this.showHover(props, e.point.x, e.point.y);
            } else {
                this.hoverPos = { x: e.point.x + 14, y: e.point.y + 14 };
            }
        });
    }

    private getTopPolygonProperties(point: maplibregl.PointLike) {
        const layers = this.polygonFillLayerIds.filter(id => this.map.getLayer(id));
        if (!layers.length) return null;

        for (const layerId of layers) {
            const features = this.map.queryRenderedFeatures(point, { layers: [layerId] });
            const props = features[0]?.properties as any;
            if (props) return props;
        }

        return null;
    }

    private isProvinceBoundaryFeature(feature: GeoJsonFeature) {
        return this.isProvinceLevel(this.toBoundaryLocation(feature));
    }

    private isCommuneBoundaryFeature(feature: GeoJsonFeature) {
        return this.isCommuneLevel(this.toBoundaryLocation(feature));
    }

    private toBoundaryLocation(feature: GeoJsonFeature) {
        const props = feature.properties || {};
        return {
            code: this.toStringValue(props['code']),
            category: this.toStringValue(props['category']),
            propertiesJson: this.toStringValue(props['propertiesJson'])
        } as GisLocationDto;
    }

    isAnyDrawMode(): boolean {
        return this.addMode || this.drawPolygonMode || this.drawLineMode || !!this.measureMode;
    }

    // --- Polygon drawing ---

    togglePolygonMode() {
        if (this.drawPolygonMode) {
            this.cancelPolygon();
        } else {
            this.cancelAllInteractionModes();
            this.drawPolygonMode = true;
            this.drawingPoints = [];
            this.map.getCanvas().style.cursor = 'crosshair';
        }
    }

    addPolygonPoint(lng: number, lat: number) {
        this.drawingPoints.push([lng, lat]);
        this.updateDrawingLayer();
    }

    private updateDrawingLayer() {
        const pts = this.drawingPoints;

        // Dots for each vertex
        this.drawDotMarkers.forEach(m => m.remove());
        this.drawDotMarkers = [];
        pts.forEach(([lng, lat]) => {
            const dot = document.createElement('div');
            dot.className = 'gis-draw-dot';
            const m = new maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(this.map);
            this.drawDotMarkers.push(m);
        });

        // Polygon preview line
        const lineCoords = pts.length >= 2 ? [...pts, pts[0]] : pts;
        const fc: any = {
            type: 'FeatureCollection',
            features: pts.length >= 2 ? [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: lineCoords },
                properties: {}
            }] : []
        };
        const src = this.map.getSource('drawing-source') as GeoJSONSource | undefined;
        if (src) {
            src.setData(fc);
        } else {
            this.map.addSource('drawing-source', { type: 'geojson', data: fc });
            this.map.addLayer({
                id: 'drawing-line',
                type: 'line',
                source: 'drawing-source',
                paint: { 'line-color': '#faad14', 'line-width': 2, 'line-dasharray': [4, 2] }
            });
        }
    }

    private clearDrawingLayer() {
        this.drawDotMarkers.forEach(m => m.remove());
        this.drawDotMarkers = [];
        if (this.map.getLayer('drawing-line')) this.map.removeLayer('drawing-line');
        if (this.map.getSource('drawing-source')) this.map.removeSource('drawing-source');
    }

    finishPolygon() {
        if (this.drawingPoints.length < 3) {
            this.message.warning('Cần ít nhất 3 điểm để tạo vùng');
            return;
        }
        const pts = this.drawingPoints;
        const lat = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        const lng = pts.reduce((s, p) => s + p[0], 0) / pts.length;

        this.clearDrawingLayer();
        this.drawPolygonMode = false;
        this.map.getCanvas().style.cursor = '';

        if (this.editingDto) {
            this.dto = { ...this.editingDto };
            this.dto.latitude = lat;
            this.dto.longitude = lng;
            this.dto.geometryType = 'Polygon';
            this.dto.polygonCoordinatesJson = JSON.stringify([[...pts, pts[0]]]);
            this.isEdit = true;
            this.editingDto = null;
        } else {
            this.isEdit = false;
            this.dto = new GisLocationDto();
            this.dto.latitude = lat;
            this.dto.longitude = lng;
            this.dto.geometryType = 'Polygon';
            this.dto.polygonCoordinatesJson = JSON.stringify([[...pts, pts[0]]]);
            this.dto.status = 1;
        }
        this.isModalVisible = true;
        this.drawingPoints = [];
    }

    cancelPolygon() {
        this.clearDrawingLayer();
        this.drawPolygonMode = false;
        this.drawingPoints = [];
        this.map.getCanvas().style.cursor = '';
    }

    toggleLineMode() {
        if (this.drawLineMode) {
            this.cancelLine();
        } else {
            this.cancelAllInteractionModes();
            this.drawLineMode = true;
            this.drawingPoints = [];
            this.map.getCanvas().style.cursor = 'crosshair';
        }
    }

    addLinePoint(lng: number, lat: number) {
        this.drawingPoints.push([lng, lat]);
        this.updateLineDrawingLayer();
    }

    private updateLineDrawingLayer() {
        const pts = this.drawingPoints;
        this.drawDotMarkers.forEach(m => m.remove());
        this.drawDotMarkers = [];
        pts.forEach(([lng, lat]) => {
            const dot = document.createElement('div');
            dot.className = 'gis-draw-dot';
            const m = new maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(this.map);
            this.drawDotMarkers.push(m);
        });
        const fc: any = {
            type: 'FeatureCollection',
            features: pts.length >= 2 ? [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: pts },
                properties: {}
            }] : []
        };
        const src = this.map.getSource('drawing-source') as GeoJSONSource | undefined;
        if (src) {
            src.setData(fc);
        } else {
            this.map.addSource('drawing-source', { type: 'geojson', data: fc });
            this.map.addLayer({
                id: 'drawing-line',
                type: 'line',
                source: 'drawing-source',
                paint: { 'line-color': '#13c2c2', 'line-width': 3, 'line-dasharray': [4, 2] }
            });
        }
    }

    finishLine() {
        if (this.drawingPoints.length < 2) {
            this.message.warning('Cần ít nhất 2 điểm để tạo đường');
            return;
        }
        const pts = this.drawingPoints;
        this.clearDrawingLayer();
        this.drawLineMode = false;
        this.map.getCanvas().style.cursor = '';

        if (this.editingDto) {
            this.dto = { ...this.editingDto };
            this.dto.latitude = pts[0][1];
            this.dto.longitude = pts[0][0];
            this.dto.geometryType = 'LineString';
            this.dto.polygonCoordinatesJson = JSON.stringify(pts);
            this.isEdit = true;
            this.editingDto = null;
        } else {
            this.isEdit = false;
            this.dto = new GisLocationDto();
            this.dto.latitude = pts[0][1];
            this.dto.longitude = pts[0][0];
            this.dto.geometryType = 'LineString';
            this.dto.polygonCoordinatesJson = JSON.stringify(pts);
            this.dto.status = 1;
        }
        this.isModalVisible = true;
        this.drawingPoints = [];
    }

    cancelLine() {
        this.clearDrawingLayer();
        this.drawLineMode = false;
        this.drawingPoints = [];
        this.map.getCanvas().style.cursor = '';
    }

    // --- Measurement ---

    toggleMeasure(mode: 'distance' | 'area') {
        if (this.measureMode === mode) {
            this.cancelMeasure();
            return;
        }
        this.cancelAllInteractionModes();
        this.measureMode = mode;
        this.measurePoints = [];
        this.measureResult = '';
        this.map.getCanvas().style.cursor = 'crosshair';
    }

    addMeasurePoint(lng: number, lat: number) {
        this.measurePoints.push([lng, lat]);
        const dot = document.createElement('div');
        dot.className = 'gis-measure-dot';
        const m = new maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(this.map);
        this.measureMarkers.push(m);
        this.updateMeasureLayer();
        this.updateMeasureResult();
    }

    private updateMeasureLayer() {
        const pts = this.measurePoints;
        const isArea = this.measureMode === 'area';
        const coords = isArea && pts.length >= 3 ? [...pts, pts[0]] : pts;
        const fc: any = {
            type: 'FeatureCollection',
            features: pts.length >= 2 ? [{
                type: 'Feature',
                geometry: { type: isArea ? 'Polygon' : 'LineString', coordinates: isArea ? [coords] : coords },
                properties: {}
            }] : []
        };
        const src = this.map.getSource('measure-source') as GeoJSONSource | undefined;
        if (src) {
            src.setData(fc);
        } else {
            this.map.addSource('measure-source', { type: 'geojson', data: fc });
            this.map.addLayer({
                id: 'measure-shape',
                type: isArea ? 'fill' : 'line',
                source: 'measure-source',
                paint: isArea
                    ? { 'fill-color': '#f5222d', 'fill-opacity': 0.15 }
                    : { 'line-color': '#f5222d', 'line-width': 3, 'line-dasharray': [3, 2] }
            } as any);
            if (isArea) {
                this.map.addLayer({
                    id: 'measure-shape-outline',
                    type: 'line',
                    source: 'measure-source',
                    paint: { 'line-color': '#f5222d', 'line-width': 2, 'line-dasharray': [3, 2] }
                });
            }
        }
    }

    private updateMeasureResult() {
        if (this.measureMode === 'distance') {
            let total = 0;
            for (let i = 1; i < this.measurePoints.length; i++) {
                total += this.haversine(this.measurePoints[i - 1], this.measurePoints[i]);
            }
            this.measureResult = total < 1 ? `${(total * 1000).toFixed(0)} m` : `${total.toFixed(2)} km`;
        } else {
            if (this.measurePoints.length < 3) { this.measureResult = '0 m²'; return; }
            const area = this.sphericalArea(this.measurePoints);
            this.measureResult = area < 1_000_000 ? `${area.toFixed(0)} m²` : `${(area / 1_000_000).toFixed(2)} km²`;
        }
    }

    private haversine(p1: [number, number], p2: [number, number]): number {
        const R = 6371;
        const toRad = (v: number) => v * Math.PI / 180;
        const dLat = toRad(p2[1] - p1[1]);
        const dLng = toRad(p2[0] - p1[0]);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p1[1])) * Math.cos(toRad(p2[1])) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private sphericalArea(coords: [number, number][]): number {
        const R = 6378137;
        const toRad = (v: number) => v * Math.PI / 180;
        let total = 0;
        for (let i = 0; i < coords.length; i++) {
            const p1 = coords[i];
            const p2 = coords[(i + 1) % coords.length];
            total += toRad(p2[0] - p1[0]) * (2 + Math.sin(toRad(p1[1])) + Math.sin(toRad(p2[1])));
        }
        return Math.abs(total * R * R / 2);
    }

    cancelMeasure() {
        this.measureMode = null;
        this.measurePoints = [];
        this.measureResult = '';
        this.measureMarkers.forEach(m => m.remove());
        this.measureMarkers = [];
        ['measure-shape', 'measure-shape-outline'].forEach(id => {
            if (this.map.getLayer(id)) this.map.removeLayer(id);
        });
        if (this.map.getSource('measure-source')) this.map.removeSource('measure-source');
        this.map.getCanvas().style.cursor = '';
    }

    // --- Basemap switching ---

    changeBasemap(key: string) {
        if (!this.basemaps[key] || !this.map) return;
        this.selectedBasemap = key;
        const src = this.map.getSource('basemap') as maplibregl.RasterTileSource;
        if (src && typeof (src as any).setTiles === 'function') {
            (src as any).setTiles(this.basemaps[key].tiles);
        }
    }

    // --- Legend ---

    toggleLegend() {
        this.isLegendVisible = !this.isLegendVisible;
    }

    // --- Import GeoJSON ---

    triggerImport() {
        this.importInput?.nativeElement.click();
    }

    onImportFile(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                const features: any[] = parsed?.type === 'FeatureCollection' ? (parsed.features || [])
                    : parsed?.type === 'Feature' ? [parsed] : [];
                if (!features.length) { this.message.warning('Không tìm thấy feature nào'); return; }
                this.importFeatures(features);
            } catch {
                this.message.error('File GeoJSON không hợp lệ');
            }
        };
        reader.readAsText(file);
        input.value = '';
    }

    private importFeatures(features: any[]) {
        this.importing = true;
        let done = 0;
        let success = 0;
        const total = features.length;
        const next = () => {
            if (done >= total) {
                this.importing = false;
                this.message.success(`Đã import ${success}/${total}`);
                this.refreshMap();
                return;
            }
            const dto = this.featureToDto(features[done]);
            done++;
            if (!dto) { next(); return; }
            this.service.create(dto).pipe(takeUntil(this.destroy$)).subscribe({
                next: (res: any) => { if (res?.status !== false) success++; next(); },
                error: () => next()
            });
        };
        next();
    }

    private featureToDto(f: any): GisLocationDto | null {
        if (!f?.geometry) return null;
        const dto = new GisLocationDto();
        const props = f.properties || {};
        dto.name = props.name || props.title || 'Imported';
        dto.code = props.code;
        dto.category = props.category;
        dto.description = props.description;
        dto.address = props.address;
        dto.iconType = props.iconType;
        dto.color = props.color;
        dto.status = props.status != null ? Number(props.status) : 1;

        const g = f.geometry;
        if (g.type === 'Point' && Array.isArray(g.coordinates)) {
            dto.geometryType = 'Point';
            dto.longitude = g.coordinates[0];
            dto.latitude = g.coordinates[1];
        } else if (g.type === 'Polygon' && Array.isArray(g.coordinates)) {
            dto.geometryType = 'Polygon';
            dto.polygonCoordinatesJson = JSON.stringify(g.coordinates);
            const ring = g.coordinates[0] || [];
            if (ring.length) {
                dto.longitude = ring.reduce((s: number, p: number[]) => s + p[0], 0) / ring.length;
                dto.latitude = ring.reduce((s: number, p: number[]) => s + p[1], 0) / ring.length;
            }
        } else if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
            dto.geometryType = 'LineString';
            dto.polygonCoordinatesJson = JSON.stringify(g.coordinates);
            dto.longitude = g.coordinates[0][0];
            dto.latitude = g.coordinates[0][1];
        } else {
            return null;
        }
        return dto;
    }

    // --- Export image ---

    exportImage() {
        this.map.once('render', () => {
            const canvas = this.map.getCanvas();
            canvas.toBlob((blob) => {
                if (!blob) { this.message.error('Không thể xuất ảnh'); return; }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `map-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
            }, 'image/png');
        });
        this.map.triggerRepaint();
    }

    // --- Redraw polygon / line for edit ---

    redrawShape() {
        if (this.dto.geometryType !== 'Polygon' && this.dto.geometryType !== 'LineString') {
            this.message.warning('Chỉ áp dụng cho Vùng hoặc Đường');
            return;
        }
        const isLine = this.dto.geometryType === 'LineString';
        const editing = { ...this.dto };
        this.isModalVisible = false;
        this.cancelAllInteractionModes();
        this.drawingPoints = [];
        if (isLine) {
            this.drawLineMode = true;
        } else {
            this.drawPolygonMode = true;
        }
        this.editingDto = editing;
        this.map.getCanvas().style.cursor = 'crosshair';
        this.message.info(isLine ? 'Click trên bản đồ để vẽ lại đường, double-click để kết thúc' : 'Click trên bản đồ để vẽ lại vùng, double-click để kết thúc');
    }

    private editingDto: GisLocationDto | null = null;

    private cancelAllInteractionModes() {
        this.addMode = false;
        if (this.drawPolygonMode) { this.clearDrawingLayer(); this.drawPolygonMode = false; this.drawingPoints = []; }
        if (this.drawLineMode) { this.clearDrawingLayer(); this.drawLineMode = false; this.drawingPoints = []; }
        if (this.measureMode) { this.cancelMeasure(); }
        this.map?.getCanvas().style.removeProperty('cursor');
    }

    // --- Share ---

    shareLocation(item: GisLocationDto) {
        const url = `${location.origin}${location.pathname}?lat=${item.latitude}&lng=${item.longitude}&zoom=16&id=${item.id}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(
                () => this.message.success('Đã copy liên kết'),
                () => this.message.error('Không thể copy')
            );
        }
    }

    toggleCluster() {
        this.clusterEnabled = !this.clusterEnabled;
        this.refreshMap();
    }

    toggleHeatmap() {
        this.heatmapEnabled = !this.heatmapEnabled;
        this.refreshMap();
    }

    toggleAddMode() {
        if (this.addMode) {
            this.addMode = false;
            this.map.getCanvas().style.cursor = '';
            return;
        }
        this.cancelAllInteractionModes();
        this.addMode = true;
        this.map.getCanvas().style.cursor = 'crosshair';
    }

    onSearch() {
        this.filter.currentPage = 1;
        this.listLoaded = false;
        if (this.isListModalVisible) this.loadList();
        this.refreshMap();
    }

    resetFilter() {
        this.filter = new GisLocationDto();
        this.filter.pageSize = 20;
        this.filteredCommunes = [];
        this.listLoaded = false;
        if (this.isListModalVisible) this.loadList();
        this.refreshMap();
    }

    onPageChange(page: number) {
        this.filter.currentPage = page;
        this.loadList();
    }

    onSort(sortBy: string, sortOrder: string | null) {
        this.filter.sortBy = sortOrder ? sortBy : undefined;
        this.filter.sortOrder = (sortOrder as 'asc' | 'desc' | null) || undefined;
        this.loadList();
    }

    openPopup(item: GisLocationDto) {
        this.popupItem = item;
        this.isPopupVisible = true;
    }

    closePopup() {
        this.isPopupVisible = false;
        this.popupItem = null;
    }

    getIconDef(iconType?: string | null) { return getIconDef(iconType); }

    get modalTitle(): string {
        if (this.isEdit) return 'Sửa vị trí';
        if (this.dto.geometryType === 'Polygon') return 'Thêm vùng';
        if (this.dto.geometryType === 'LineString') return 'Thêm đường';
        return 'Thêm vị trí';
    }

    openCreate(lng?: number, lat?: number) {
        this.isEdit = false;
        this.dto = new GisLocationDto();
        if (lng != null && lat != null) {
            this.dto.longitude = lng;
            this.dto.latitude = lat;
        }
        this.dto.status = 1;
        this.dto.geometryType = 'Point';
        this.isModalVisible = true;
    }

    openEdit(item: GisLocationDto) {
        this.isEdit = true;
        this.service.getById(item.id!).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: any) => {
                this.dto = { ...(res || item) };
                this.isModalVisible = true;
                this.closePopup();
            }
        });
    }

    save() {
        if (!this.dto.name) {
            this.message.warning('Vui lòng nhập tên');
            return;
        }
        if (this.dto.geometryType !== 'Polygon' && this.dto.geometryType !== 'LineString' && (this.dto.latitude == null || this.dto.longitude == null)) {
            this.message.warning('Vui lòng nhập toạ độ');
            return;
        }
        if (this.dto.data) {
            this.dto.data = sanitizeHtml(this.dto.data, 'richText');
        }
        const req$ = this.isEdit ? this.service.update(this.dto) : this.service.create(this.dto);
        req$.pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: any) => {
                if (res?.status === false) {
                    this.message.error(res?.messageObject?.message || 'Lỗi');
                    return;
                }
                this.isModalVisible = false;
                this.listLoaded = false;
                if (this.isListModalVisible) this.loadList();
                this.refreshMap();
                this.loadCategories();
            }
        });
    }

    delete(item: GisLocationDto) {
        this.modal.confirm({
            nzTitle: 'Xác nhận xoá?',
            nzContent: `Xoá vị trí "${item.name}"?`,
            nzOkDanger: true,
            nzOnOk: () => {
                this.service.delete(item.id!).pipe(takeUntil(this.destroy$)).subscribe({
                    next: () => {
                        this.listLoaded = false;
                        if (this.isListModalVisible) this.loadList();
                        this.refreshMap();
                    }
                });
            }
        });
    }

    showHover(props: any, x: number, y: number): void {
        this.hoverItem = {
            name: props['name'],
            code: props['code'],
            category: props['category'],
            address: props['address'],
            description: props['description'],
            geometryType: props['geometryType'],
            iconType: props['iconType'],
            latitude: props['latitude'],
            longitude: props['longitude'],
        } as GisLocationDto;
        this.hoverPos = { x: x + 14, y: y + 14 };
    }

    hideHover(): void {
        this.hoverItem = null;
    }

    flyTo(item: GisLocationDto) {
        if (item.longitude == null || item.latitude == null) return;
        this.isListModalVisible = false;
        this.map.flyTo({ center: [+item.longitude, +item.latitude] as LngLatLike, zoom: 16 });
    }

    exportGeoJson() {
        this.service.geoJson({ ...this.filter, pageSize: 100000 } as any).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: any) => {
                const data = res || { type: 'FeatureCollection', features: [] };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/geo+json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gis-locations-${Date.now()}.geojson`;
                a.click();
                URL.revokeObjectURL(url);
            }
        });
    }
}
