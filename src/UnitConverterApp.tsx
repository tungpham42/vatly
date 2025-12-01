import React, { useMemo, useState, JSX } from "react";
import {
  Card,
  Layout,
  Select,
  InputNumber,
  Row,
  Col,
  Button,
  Divider,
  Form,
  Space,
  Typography,
  message,
} from "antd";
import { SwapOutlined, CopyOutlined, ClearOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;
const { Option } = Select;
const { Title, Text } = Typography;

// Types
type QuantityKey =
  | "length"
  | "mass"
  | "time"
  | "area"
  | "volume"
  | "speed"
  | "acceleration"
  | "force"
  | "pressure"
  | "energy"
  | "power"
  | "temperature"
  | "density";

const QuantityLabels: Record<QuantityKey, string> = {
  length: "Độ dài",
  mass: "Khối lượng",
  time: "Thời gian",
  area: "Diện tích",
  volume: "Thể tích",
  speed: "Vận tốc",
  acceleration: "Gia tốc",
  force: "Lực",
  pressure: "Áp suất",
  energy: "Năng lượng",
  power: "Công suất",
  temperature: "Nhiệt độ",
  density: "Khối lượng riêng",
};

type Unit = {
  key: string; // unique id
  name: string; // display
  toSI: (v: number) => number; // convert value in this unit -> SI base
  fromSI: (v: number) => number; // convert SI base -> this unit
};

// Helper to build linear units via factor to SI
const linearUnit = (key: string, name: string, factorToSI: number): Unit => ({
  key,
  name,
  toSI: (v: number) => v * factorToSI,
  fromSI: (v: number) => v / factorToSI,
});

// Units database. For each quantity choose a SI base unit and provide conversions.
const UNITS: Record<QuantityKey, { base: string; units: Unit[] }> = {
  length: {
    base: "m",
    units: [
      linearUnit("m", "m (mét)", 1),
      linearUnit("km", "km (kilômét)", 1000),
      linearUnit("cm", "cm (xăng-ti-mét)", 0.01),
      linearUnit("mm", "mm (mili-mét)", 0.001),
      linearUnit("um", "μm (micrômét)", 1e-6),
      linearUnit("nm", "nm (nanômét)", 1e-9),
      linearUnit("pm", "pm (picômét)", 1e-12),
      linearUnit("in", "in (inch)", 0.0254),
      linearUnit("ft", "ft (foot)", 0.3048),
      linearUnit("yd", "yd (yard)", 0.9144),
      linearUnit("mi", "mi (mile)", 1609.344),
      linearUnit("nmi", "nmi (hải lý)", 1852),
      linearUnit("ly", "ly (năm ánh sáng)", 9.4607e15),
    ],
  },

  mass: {
    base: "kg",
    units: [
      linearUnit("kg", "kg (kilôgam)", 1),
      linearUnit("g", "g (gam)", 0.001),
      linearUnit("mg", "mg (miligam)", 1e-6),
      linearUnit("t", "t (tấn)", 1000),
      linearUnit("lb", "lb (pound)", 0.45359237),
      linearUnit("oz", "oz (ounce)", 0.028349523125),
      linearUnit("st", "st (stone)", 6.35029318),
    ],
  },

  time: {
    base: "s",
    units: [
      linearUnit("s", "s (giây)", 1),
      linearUnit("ms", "ms (mili-giây)", 1e-3),
      linearUnit("us", "μs (micro-giây)", 1e-6),
      linearUnit("ns", "ns (nano-giây)", 1e-9),
      linearUnit("min", "min (phút)", 60),
      linearUnit("h", "h (giờ)", 3600),
      linearUnit("day", "day (ngày)", 86400),
      linearUnit("week", "week (tuần)", 604800),
      linearUnit("year", "year (năm)", 31557600), // trung bình năm
    ],
  },

  area: {
    base: "m2",
    units: [
      linearUnit("m2", "m² (mét vuông)", 1),
      linearUnit("cm2", "cm² (xăng-ti-mét vuông)", 0.0001),
      linearUnit("mm2", "mm² (mili-mét vuông)", 1e-6),
      linearUnit("km2", "km² (kilômét vuông)", 1e6),
      linearUnit("ha", "ha (hecta)", 10000),
      linearUnit("acre", "acre (mẫu Anh)", 4046.8564224),
      linearUnit("ft2", "ft² (foot vuông)", 0.09290304),
      linearUnit("yd2", "yd² (yard vuông)", 0.83612736),

      // Việt Nam – Bắc Bộ
      linearUnit("sao_bac", "sào Bắc Bộ (360 m²)", 360),
      linearUnit("mau_bac", "mẫu Bắc Bộ (3600 m²)", 3600),

      // Việt Nam – Trung Bộ
      linearUnit("sao_trung", "sào Trung Bộ (500 m²)", 500),
      linearUnit("mau_trung", "mẫu Trung Bộ (5000 m²)", 5000),

      // Việt Nam – Nam Bộ (công đất)
      linearUnit("cong", "công (miền Nam) ~ 1000 m²", 1000),
    ],
  },

  volume: {
    base: "m3",
    units: [
      linearUnit("m3", "m³ (mét khối)", 1),
      linearUnit("L", "L (lít)", 0.001),
      linearUnit("mL", "mL (mililít)", 1e-6),
      linearUnit("cm3", "cm³ (xăng-ti-mét khối)", 1e-6),
      linearUnit("ft3", "ft³ (foot khối)", 0.028316846592),
      linearUnit("in3", "in³ (inch khối)", 1.6387e-5),
      linearUnit("gal_us", "gal (Mỹ)", 0.003785411784),
      linearUnit("gal_uk", "gal (Anh)", 0.00454609),
    ],
  },

  speed: {
    base: "m/s",
    units: [
      linearUnit("m_s", "m/s (mét trên giây)", 1),
      linearUnit("km_h", "km/h (kilômét/giờ)", 1000 / 3600),
      linearUnit("mph", "mph (mile/giờ)", 1609.344 / 3600),
      linearUnit("knot", "knot (hải lý/giờ)", 1852 / 3600),
      linearUnit("ft_s", "ft/s (foot/giây)", 0.3048),
    ],
  },

  acceleration: {
    base: "m/s2",
    units: [
      linearUnit("m_s2", "m/s² (mét trên giây bình phương)", 1),
      linearUnit("g0", "g (gia tốc trọng trường)", 9.80665),
    ],
  },

  force: {
    base: "N",
    units: [
      linearUnit("N", "N (Newton)", 1),
      linearUnit("kN", "kN (kilonewton)", 1000),
      linearUnit("lbf", "lbf (pound-force)", 4.4482216152605),
      linearUnit("dyne", "dyne", 1e-5),
    ],
  },

  pressure: {
    base: "Pa",
    units: [
      linearUnit("Pa", "Pa (Pascal)", 1),
      linearUnit("kPa", "kPa (kilopascal)", 1000),
      linearUnit("bar", "bar", 1e5),
      linearUnit("atm", "atm (atmosphere)", 101325),
      linearUnit("psi", "psi (pound/in²)", 6894.757293168),
      linearUnit("mmHg", "mmHg (milimét thuỷ ngân)", 133.322387415),
      linearUnit("torr", "torr", 133.322368),
    ],
  },

  energy: {
    base: "J",
    units: [
      linearUnit("J", "J (Joule)", 1),
      linearUnit("kJ", "kJ (kilojoule)", 1000),
      linearUnit("cal", "cal (calori)", 4.184),
      linearUnit("kcal", "kcal (kilocalori)", 4184),
      linearUnit("Wh", "Wh (Watt-giờ)", 3600),
      linearUnit("kWh", "kWh (kilowatt-giờ)", 3.6e6),
      linearUnit("eV", "eV (electronvolt)", 1.602176634e-19),
      linearUnit("BTU", "BTU (British Thermal Unit)", 1055.05585),
      linearUnit("erg", "erg", 1e-7),
    ],
  },

  power: {
    base: "W",
    units: [
      linearUnit("W", "W (Watt)", 1),
      linearUnit("kW", "kW (kilowatt)", 1000),
      linearUnit("MW", "MW (megawatt)", 1e6),
      linearUnit("GW", "GW (gigawatt)", 1e9),
      linearUnit("hp", "hp (horsepower)", 745.69987158227022),
    ],
  },

  temperature: {
    base: "K",
    units: [
      {
        key: "K",
        name: "K (Kelvin)",
        toSI: (v: number) => v,
        fromSI: (v: number) => v,
      },
      {
        key: "C",
        name: "°C (Celsius)",
        toSI: (v: number) => v + 273.15,
        fromSI: (v: number) => v - 273.15,
      },
      {
        key: "F",
        name: "°F (Fahrenheit)",
        toSI: (v: number) => (v - 32) * (5 / 9) + 273.15,
        fromSI: (v: number) => (v - 273.15) * (9 / 5) + 32,
      },
      {
        key: "R",
        name: "°R (Rankine)",
        toSI: (v: number) => (v * 5) / 9,
        fromSI: (v: number) => (v * 9) / 5,
      },
    ],
  },

  density: {
    base: "kg/m3",
    units: [
      linearUnit("kg_m3", "kg/m³ (kilôgam trên mét khối)", 1),
      linearUnit("g_cm3", "g/cm³ (gam trên xăng-ti-mét khối)", 1000),
      linearUnit("lb_ft3", "lb/ft³ (pound trên foot khối)", 16.01846337396),
      linearUnit("oz_in3", "oz/in³ (ounce trên inch khối)", 1729.994),
    ],
  },
};

// Utilities
const formatNumber = (v: number) => {
  if (!isFinite(v)) return "NaN";

  const abs = Math.abs(v);

  // Format theo chuẩn Việt Nam
  const vnFormat = (num: number, digits = 2) =>
    num.toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });

  // Đơn vị lớn
  if (abs >= 1e24) return vnFormat(v / 1e24) + " triệu tỉ tỉ";
  if (abs >= 1e21) return vnFormat(v / 1e21) + " nghìn tỉ tỉ";
  if (abs >= 1e18) return vnFormat(v / 1e18) + " tỉ tỉ";
  if (abs >= 1e15) return vnFormat(v / 1e15) + " triệu tỉ";
  if (abs >= 1e12) return vnFormat(v / 1e12) + " nghìn tỉ";
  if (abs >= 1e9) return vnFormat(v / 1e9) + " tỉ";
  if (abs >= 1e6) return vnFormat(v / 1e6) + " triệu";
  if (abs >= 1e3) return vnFormat(v / 1e3) + " ngàn";

  // Đơn vị nhỏ
  if (abs > 0 && abs < 1e-9) return vnFormat(v * 1e9) + " phần tỉ";
  if (abs >= 1e-9 && abs < 1e-6) return vnFormat(v * 1e9) + " phần tỉ";
  if (abs >= 1e-6 && abs < 1e-3) return vnFormat(v * 1e6) + " phần triệu";
  if (abs >= 1e-3 && abs < 1) return vnFormat(v * 1e3) + " phần nghìn";

  // Số bình thường (format VN)
  return vnFormat(v, 12);
};

// Converter component
export default function UnitConverterApp(): JSX.Element {
  const quantityKeys = Object.keys(UNITS) as QuantityKey[];

  const [quantity, setQuantity] = useState<QuantityKey>("length");
  const unitsForQuantity = UNITS[quantity].units;

  const [fromUnitKey, setFromUnitKey] = useState<string>(
    unitsForQuantity[0].key
  );
  const [toUnitKey, setToUnitKey] = useState<string>(
    unitsForQuantity[1]?.key ?? unitsForQuantity[0].key
  );
  const [value, setValue] = useState<number | null>(1);

  // When quantity changes, reset unit selections sensibly
  React.useEffect(() => {
    const u = UNITS[quantity].units;
    setFromUnitKey(u[0].key);
    setToUnitKey(u[1]?.key ?? u[0].key);
  }, [quantity]);

  const convert = (
    q: QuantityKey,
    fromKey: string,
    toKey: string,
    v: number
  ) => {
    const list = UNITS[q].units;
    const from = list.find((u) => u.key === fromKey) || list[0];
    const to = list.find((u) => u.key === toKey) || list[0];
    const si = from.toSI(v);
    const out = to.fromSI(si);
    return out;
  };

  const result = useMemo(() => {
    if (value === null) return NaN;
    return convert(quantity, fromUnitKey, toUnitKey, value);
  }, [quantity, fromUnitKey, toUnitKey, value]);

  const handleSwap = () => {
    setFromUnitKey((prev) => {
      setToUnitKey(prev);
      return toUnitKey;
    });
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(String(result));
      message.success("Đã copy kết quả");
    } catch (e) {
      message.error("Không thể copy (trình duyệt không hỗ trợ)");
    }
  };

  const clear = () => {
    setValue(null);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#001529" }}>
        <Title
          style={{
            color: "#fff",
            margin: 0,
            lineHeight: "64px",
            textAlign: "center",
          }}
          level={2}
        >
          Đơn vị Vật Lý
        </Title>
      </Header>
      <Content style={{ padding: 24 }}>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} md={20} lg={16}>
            <Card>
              <Form layout="vertical">
                <Form.Item label={<Text strong>Chọn lĩnh vực đại lượng</Text>}>
                  <Select
                    value={quantity}
                    onChange={(v) => setQuantity(v as QuantityKey)}
                  >
                    {quantityKeys.map((q) => (
                      <Option key={q} value={q}>
                        {QuantityLabels[q]}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Row gutter={12} align="middle">
                  <Col xs={24} sm={10}>
                    <Form.Item label={<Text strong>Giá trị (từ)</Text>}>
                      <InputNumber
                        style={{ width: "100%" }}
                        value={value === null ? undefined : value}
                        onChange={(v) => setValue(v ?? null)}
                        controls={true}
                        stringMode={false}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={7}>
                    <Form.Item label={<Text strong>Đơn vị (từ)</Text>}>
                      <Select
                        value={fromUnitKey}
                        onChange={(v) => setFromUnitKey(v)}
                      >
                        {UNITS[quantity].units.map((u) => (
                          <Option key={u.key} value={u.key}>
                            {u.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={7}>
                    <Form.Item label={<Text strong>Đơn vị (đến)</Text>}>
                      <Select
                        value={toUnitKey}
                        onChange={(v) => setToUnitKey(v)}
                      >
                        {UNITS[quantity].units.map((u) => (
                          <Option key={u.key} value={u.key}>
                            {u.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row justify="space-between" align="middle">
                  <Col>
                    <Space>
                      <Button icon={<SwapOutlined />} onClick={handleSwap}>
                        Đổi chỗ
                      </Button>
                      <Button icon={<CopyOutlined />} onClick={copyResult}>
                        Copy
                      </Button>
                      <Button icon={<ClearOutlined />} onClick={clear}>
                        Xóa
                      </Button>
                    </Space>
                  </Col>

                  <Col>
                    <Text type="secondary">
                      Đơn vị cơ sở SI: {UNITS[quantity].base}
                    </Text>
                  </Col>
                </Row>

                <Divider />

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Card type="inner" title="Đầu vào">
                      <Text>
                        {value === null
                          ? "(rỗng)"
                          : `${formatNumber(value)} ${
                              UNITS[quantity].units.find(
                                (u) => u.key === fromUnitKey
                              )?.name ?? ""
                            }`}
                      </Text>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card type="inner" title="Kết quả">
                      <Title level={4}>{formatNumber(result)}</Title>
                      <Text>
                        {UNITS[quantity].units.find((u) => u.key === toUnitKey)
                          ?.name ?? ""}
                      </Text>
                    </Card>
                  </Col>
                </Row>

                <Divider />

                <Card type="inner" title="Các đơn vị khác trong cùng lĩnh vực">
                  <Row gutter={[8, 8]}>
                    {UNITS[quantity].units.map((u) => {
                      const val = (() => {
                        if (value === null) return NaN;
                        const fromUnit = UNITS[quantity].units.find(
                          (f) => f.key === fromUnitKey
                        );
                        if (!fromUnit) return NaN;
                        return u.fromSI(fromUnit.toSI(value));
                      })();
                      return (
                        <Col key={u.key} xs={12} sm={8} md={6}>
                          <Card size="small">
                            <Text strong>{u.name}</Text>
                            <div style={{ marginTop: 8 }}>
                              {formatNumber(val)}
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Card>

                <Divider />

                <Card type="inner" title="Ghi chú và công thức">
                  <Text>
                    1. Chuyển đổi được thực hiện qua đơn vị cơ sở SI. Với đại
                    lượng có hằng số/offset (ví dụ nhiệt độ), sử dụng công thức
                    chuyên biệt.
                    <br />
                    2. Kết quả trình bày ở dạng ký số để giữ độ chính xác.
                  </Text>
                </Card>
              </Form>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
