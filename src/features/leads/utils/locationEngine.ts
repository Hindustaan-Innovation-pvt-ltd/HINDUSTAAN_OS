export interface CityOption {
  value: string;
  label: string;
  queryKeyword: string;
}

export interface StateOption {
  value: string;
  label: string;
  cities: CityOption[];
}

export interface CountryOption {
  value: string;
  label: string;
  flag: string;
  track: 'local' | 'foreign';
  states: StateOption[];
}

export interface SectorOption {
  value: string;
  label: string;
  baseQuery: string;
}

export const GEOGRAPHIC_DATA: CountryOption[] = [
  {
    value: 'IN',
    label: 'India',
    flag: '🇮🇳',
    track: 'local',
    states: [
      {
        value: 'ALL_INDIA',
        label: '🇮🇳 All India (Pan-India Scan)',
        cities: [
          { value: 'all_india', label: 'Across Entire India (Pan-India)', queryKeyword: 'India' },
          { value: 'metro_tier1', label: 'Major Tier-1 Metros (Delhi, Mumbai, BLR, HYD, CHE, KOL)', queryKeyword: 'Delhi Mumbai Bengaluru Hyderabad Chennai Kolkata India' },
          { value: 'tier2_hubs', label: 'Emerging Tier-2 Commercial Hubs', queryKeyword: 'Raipur Indore Pune Ahmedabad Jaipur Lucknow India' },
        ],
      },
      {
        value: 'CG',
        label: 'Chhattisgarh (Priority Turf)',
        cities: [
          { value: 'all_cg', label: 'All Districts in Chhattisgarh', queryKeyword: 'Chhattisgarh India' },
          { value: 'raipur', label: 'Raipur District (Capital & Commercial Hub)', queryKeyword: 'Raipur Chhattisgarh' },
          { value: 'bhilai_durg', label: 'Durg & Bhilai (Steel, Education & Tech)', queryKeyword: 'Bhilai Durg Chhattisgarh' },
          { value: 'bilaspur', label: 'Bilaspur District (Commercial & High Court/SECR)', queryKeyword: 'Bilaspur Chhattisgarh' },
          { value: 'korba', label: 'Korba District (Power, Coal & Industrial)', queryKeyword: 'Korba Chhattisgarh' },
          { value: 'rajnandgaon', label: 'Rajnandgaon District (Industrial & Agri-Trade)', queryKeyword: 'Rajnandgaon Chhattisgarh' },
          { value: 'raigarh', label: 'Raigarh District (Steel, Power & Ports)', queryKeyword: 'Raigarh Chhattisgarh' },
          { value: 'bastar', label: 'Bastar & Jagdalpur (Tourism & Mining)', queryKeyword: 'Jagdalpur Bastar Chhattisgarh' },
          { value: 'surguja', label: 'Surguja & Ambikapur (North CG Hub)', queryKeyword: 'Ambikapur Surguja Chhattisgarh' },
          { value: 'dhamtari', label: 'Dhamtari District (Rice & Agro-Industries)', queryKeyword: 'Dhamtari Chhattisgarh' },
          { value: 'mahasamund', label: 'Mahasamund District', queryKeyword: 'Mahasamund Chhattisgarh' },
          { value: 'balod', label: 'Balod District', queryKeyword: 'Balod Chhattisgarh' },
          { value: 'bemetara', label: 'Bemetara District', queryKeyword: 'Bemetara Chhattisgarh' },
          { value: 'kabirdham', label: 'Kabirdham (Kawardha)', queryKeyword: 'Kawardha Kabirdham Chhattisgarh' },
          { value: 'janjgir_champa', label: 'Janjgir-Champa District (Textiles & Power)', queryKeyword: 'Janjgir Champa Chhattisgarh' },
          { value: 'baloda_bazar', label: 'Baloda Bazar - Bhatapara (Cement Hub)', queryKeyword: 'Baloda Bazar Bhatapara Chhattisgarh' },
          { value: 'gariaband', label: 'Gariaband District', queryKeyword: 'Gariaband Chhattisgarh' },
          { value: 'mungeli', label: 'Mungeli District', queryKeyword: 'Mungeli Chhattisgarh' },
          { value: 'gpm', label: 'Gaurela-Pendra-Marwahi', queryKeyword: 'Gaurela Pendra Marwahi Chhattisgarh' },
          { value: 'kanker', label: 'North Bastar (Kanker)', queryKeyword: 'Kanker Chhattisgarh' },
          { value: 'kondagaon', label: 'Kondagaon District', queryKeyword: 'Kondagaon Chhattisgarh' },
          { value: 'narayanpur', label: 'Narayanpur District', queryKeyword: 'Narayanpur Chhattisgarh' },
          { value: 'dantewada', label: 'South Bastar (Dantewada)', queryKeyword: 'Dantewada Chhattisgarh' },
          { value: 'bijapur', label: 'Bijapur District', queryKeyword: 'Bijapur Chhattisgarh' },
          { value: 'sukma', label: 'Sukma District', queryKeyword: 'Sukma Chhattisgarh' },
          { value: 'jashpur', label: 'Jashpur District', queryKeyword: 'Jashpur Chhattisgarh' },
          { value: 'koriya', label: 'Koriya District (Baikunthpur)', queryKeyword: 'Koriya Baikunthpur Chhattisgarh' },
          { value: 'mcb', label: 'Manendragarh-Chirmiri-Bharatpur', queryKeyword: 'Manendragarh Chirmiri Chhattisgarh' },
          { value: 'surajpur', label: 'Surajpur District', queryKeyword: 'Surajpur Chhattisgarh' },
          { value: 'balrampur', label: 'Balrampur-Ramanujganj', queryKeyword: 'Balrampur Chhattisgarh' },
          { value: 'khairagarh', label: 'Khairagarh-Chhuikhadan-Gandai', queryKeyword: 'Khairagarh Chhattisgarh' },
          { value: 'mohla_manpur', label: 'Mohla-Manpur-Ambagarh Chowki', queryKeyword: 'Mohla Manpur Chhattisgarh' },
          { value: 'sarangarh', label: 'Sarangarh-Bilaigarh', queryKeyword: 'Sarangarh Bilaigarh Chhattisgarh' },
          { value: 'sakti', label: 'Sakti District', queryKeyword: 'Sakti Chhattisgarh' },
        ],
      },
      {
        value: 'MH',
        label: 'Maharashtra',
        cities: [
          { value: 'all_mh', label: 'All Districts in Maharashtra', queryKeyword: 'Maharashtra India' },
          { value: 'mumbai', label: 'Mumbai City & Suburbs (Financial Capital)', queryKeyword: 'Mumbai Maharashtra' },
          { value: 'pune', label: 'Pune (Auto, Tech & SaaS Hub)', queryKeyword: 'Pune Maharashtra' },
          { value: 'nagpur', label: 'Nagpur (MIHAN & Logistics Hub)', queryKeyword: 'Nagpur Maharashtra' },
          { value: 'thane', label: 'Thane & Navi Mumbai (Industrial & Tech)', queryKeyword: 'Thane Navi Mumbai Maharashtra' },
          { value: 'nashik', label: 'Nashik (Engineering, Agro & Pharma)', queryKeyword: 'Nashik Maharashtra' },
          { value: 'aurangabad', label: 'Chhatrapati Sambhaji Nagar (Aurangabad Auto)', queryKeyword: 'Aurangabad Chhatrapati Sambhaji Nagar Maharashtra' },
          { value: 'kolhapur', label: 'Kolhapur (Foundry & Engineering)', queryKeyword: 'Kolhapur Maharashtra' },
          { value: 'solapur', label: 'Solapur (Textiles & Beedi)', queryKeyword: 'Solapur Maharashtra' },
          { value: 'amravati', label: 'Amravati (Textiles & Trade)', queryKeyword: 'Amravati Maharashtra' },
          { value: 'jalgaon', label: 'Jalgaon (Gold & Agro-Pipe)', queryKeyword: 'Jalgaon Maharashtra' },
          { value: 'nanded', label: 'Nanded (Commerce & Agri)', queryKeyword: 'Nanded Maharashtra' },
          { value: 'sangli', label: 'Sangli-Miraj (Trading & Sugar)', queryKeyword: 'Sangli Miraj Maharashtra' },
          { value: 'satara', label: 'Satara District', queryKeyword: 'Satara Maharashtra' },
          { value: 'chandrapur', label: 'Chandrapur (Thermal & Paper)', queryKeyword: 'Chandrapur Maharashtra' },
          { value: 'ahmednagar', label: 'Ahmednagar District', queryKeyword: 'Ahmednagar Maharashtra' },
        ],
      },
      {
        value: 'DL',
        label: 'Delhi NCR',
        cities: [
          { value: 'all_ncr', label: 'All Delhi NCR Region', queryKeyword: 'Delhi NCR India' },
          { value: 'new_delhi', label: 'New Delhi (Central & Connaught Place)', queryKeyword: 'New Delhi Central Delhi NCR' },
          { value: 'south_delhi', label: 'South Delhi (Corporate & Commercial)', queryKeyword: 'South Delhi Nehru Place Okhla' },
          { value: 'gurugram', label: 'Gurugram (Cyber City, Tech & MNCs)', queryKeyword: 'Gurugram Gurgaon Haryana NCR' },
          { value: 'noida', label: 'Noida & Greater Noida (IT & Media Hub)', queryKeyword: 'Noida Greater Noida Uttar Pradesh NCR' },
          { value: 'faridabad', label: 'Faridabad (Manufacturing & Engineering)', queryKeyword: 'Faridabad Haryana NCR' },
          { value: 'ghaziabad', label: 'Ghaziabad (Industrial & Trade)', queryKeyword: 'Ghaziabad Uttar Pradesh NCR' },
          { value: 'west_delhi', label: 'West & North Delhi (Industrial Parks)', queryKeyword: 'West Delhi Kirti Nagar Mayapuri' },
        ],
      },
      {
        value: 'MP',
        label: 'Madhya Pradesh',
        cities: [
          { value: 'all_mp', label: 'All Districts in Madhya Pradesh', queryKeyword: 'Madhya Pradesh India' },
          { value: 'indore', label: 'Indore (Commercial & IT Capital)', queryKeyword: 'Indore Madhya Pradesh' },
          { value: 'bhopal', label: 'Bhopal (State Capital, Gov & Tech)', queryKeyword: 'Bhopal Madhya Pradesh' },
          { value: 'jabalpur', label: 'Jabalpur (Defense & Regional Trade)', queryKeyword: 'Jabalpur Madhya Pradesh' },
          { value: 'gwalior', label: 'Gwalior (Education & Industrial)', queryKeyword: 'Gwalior Madhya Pradesh' },
          { value: 'ujjoin', label: 'Ujjain (Tourism, Textile & Education)', queryKeyword: 'Ujjain Madhya Pradesh' },
          { value: 'sagar', label: 'Sagar District (Central MP Hub)', queryKeyword: 'Sagar Madhya Pradesh' },
          { value: 'dewas', label: 'Dewas (Industrial & Pharma)', queryKeyword: 'Dewas Madhya Pradesh' },
          { value: 'satna', label: 'Satna (Cement & Mining Hub)', queryKeyword: 'Satna Madhya Pradesh' },
          { value: 'rewa', label: 'Rewa (Energy & Solar Hub)', queryKeyword: 'Rewa Madhya Pradesh' },
          { value: 'ratlam', label: 'Ratlam (Gold & Chemicals)', queryKeyword: 'Ratlam Madhya Pradesh' },
          { value: 'singrauli', label: 'Singrauli (Energy Capital of India)', queryKeyword: 'Singrauli Madhya Pradesh' },
        ],
      },
      {
        value: 'UP',
        label: 'Uttar Pradesh',
        cities: [
          { value: 'all_up', label: 'All Districts in Uttar Pradesh', queryKeyword: 'Uttar Pradesh India' },
          { value: 'lucknow', label: 'Lucknow (Capital & IT City)', queryKeyword: 'Lucknow Uttar Pradesh' },
          { value: 'kanpur', label: 'Kanpur (Industrial & Leather Capital)', queryKeyword: 'Kanpur Uttar Pradesh' },
          { value: 'varanasi', label: 'Varanasi (Kashi Commerce & Tourism)', queryKeyword: 'Varanasi Uttar Pradesh' },
          { value: 'agra', label: 'Agra (Tourism, Footwear & Foundries)', queryKeyword: 'Agra Uttar Pradesh' },
          { value: 'prayagraj', label: 'Prayagraj (Judicial & Education)', queryKeyword: 'Prayagraj Allahabad Uttar Pradesh' },
          { value: 'meerut', label: 'Meerut (Sports Goods & Education)', queryKeyword: 'Meerut Uttar Pradesh' },
          { value: 'bareilly', label: 'Bareilly (Furniture & Trade)', queryKeyword: 'Bareilly Uttar Pradesh' },
          { value: 'aligarh', label: 'Aligarh (Hardware & Locks)', queryKeyword: 'Aligarh Uttar Pradesh' },
          { value: 'moradabad', label: 'Moradabad (Brassware Exports)', queryKeyword: 'Moradabad Uttar Pradesh' },
          { value: 'gorakhpur', label: 'Gorakhpur (Industrial & Logistics)', queryKeyword: 'Gorakhpur Uttar Pradesh' },
          { value: 'jhansi', label: 'Jhansi (Bundelkhand Hub)', queryKeyword: 'Jhansi Uttar Pradesh' },
        ],
      },
      {
        value: 'GJ',
        label: 'Gujarat',
        cities: [
          { value: 'all_gj', label: 'All Districts in Gujarat', queryKeyword: 'Gujarat India' },
          { value: 'ahmedabad', label: 'Ahmedabad (Commerce, Textile & FinTech)', queryKeyword: 'Ahmedabad Gujarat' },
          { value: 'surat', label: 'Surat (Diamond & Textile Capital)', queryKeyword: 'Surat Gujarat' },
          { value: 'vadodara', label: 'Vadodara (Chemicals, Power & Engineering)', queryKeyword: 'Vadodara Baroda Gujarat' },
          { value: 'rajkot', label: 'Rajkot (Engineering, Auto Parts & Forging)', queryKeyword: 'Rajkot Gujarat' },
          { value: 'bhavnagar', label: 'Bhavnagar (Ship Breaking & Trade)', queryKeyword: 'Bhavnagar Gujarat' },
          { value: 'jamnagar', label: 'Jamnagar (Petrochemicals & Brass)', queryKeyword: 'Jamnagar Gujarat' },
          { value: 'gandhinagar', label: 'Gandhinagar (GIFT City & IT)', queryKeyword: 'Gandhinagar GIFT City Gujarat' },
          { value: 'morbi', label: 'Morbi (Ceramic & Clock Capital)', queryKeyword: 'Morbi Gujarat' },
          { value: 'bharuch', label: 'Bharuch & Ankleshwar (Chemicals)', queryKeyword: 'Bharuch Ankleshwar Gujarat' },
          { value: 'vapi', label: 'Vapi & Valsad (Industrial Corridor)', queryKeyword: 'Vapi Valsad Gujarat' },
        ],
      },
      {
        value: 'KA',
        label: 'Karnataka',
        cities: [
          { value: 'all_ka', label: 'All Districts in Karnataka', queryKeyword: 'Karnataka India' },
          { value: 'bengaluru', label: 'Bengaluru (Silicon Valley of India)', queryKeyword: 'Bengaluru Bangalore Karnataka' },
          { value: 'mysuru', label: 'Mysuru (IT & Heritage Commerce)', queryKeyword: 'Mysuru Mysore Karnataka' },
          { value: 'hubli_dharwad', label: 'Hubballi-Dharwad (North Karnataka Commerce)', queryKeyword: 'Hubli Dharwad Karnataka' },
          { value: 'mangaluru', label: 'Mangaluru (Port, Petrochem & Education)', queryKeyword: 'Mangalore Mangaluru Karnataka' },
          { value: 'belagavi', label: 'Belagavi (Foundry, Auto & Defense)', queryKeyword: 'Belgaum Belagavi Karnataka' },
          { value: 'kalaburagi', label: 'Kalaburagi (Cement & Pulse Hub)', queryKeyword: 'Gulbarga Kalaburagi Karnataka' },
          { value: 'shivamogga', label: 'Shivamogga (Foundry & Education)', queryKeyword: 'Shimoga Shivamogga Karnataka' },
        ],
      },
      {
        value: 'RJ',
        label: 'Rajasthan',
        cities: [
          { value: 'all_rj', label: 'All Districts in Rajasthan', queryKeyword: 'Rajasthan India' },
          { value: 'jaipur', label: 'Jaipur (Pink City, Gemstones & IT)', queryKeyword: 'Jaipur Rajasthan' },
          { value: 'jodhpur', label: 'Jodhpur (Handicrafts & Solar Hub)', queryKeyword: 'Jodhpur Rajasthan' },
          { value: 'kota', label: 'Kota (Coaching & Education Capital)', queryKeyword: 'Kota Rajasthan' },
          { value: 'bikaner', label: 'Bikaner (Ceramics & Food Processing)', queryKeyword: 'Bikaner Rajasthan' },
          { value: 'udaipur', label: 'Udaipur (Marble, Zinc & Tourism)', queryKeyword: 'Udaipur Rajasthan' },
          { value: 'ajmer', label: 'Ajmer & Kishangarh (Marble & Trade)', queryKeyword: 'Ajmer Kishangarh Rajasthan' },
          { value: 'bhilwara', label: 'Bhilwara (Textile City of India)', queryKeyword: 'Bhilwara Rajasthan' },
          { value: 'alwar', label: 'Alwar & Bhiwadi (Auto & Electronics)', queryKeyword: 'Alwar Bhiwadi Rajasthan' },
        ],
      },
      {
        value: 'TS',
        label: 'Telangana',
        cities: [
          { value: 'all_ts', label: 'All Districts in Telangana', queryKeyword: 'Telangana India' },
          { value: 'hyderabad', label: 'Hyderabad (Cyberabad, Pharma & Tech)', queryKeyword: 'Hyderabad Secunderabad Telangana' },
          { value: 'warangal', label: 'Warangal (Heritage & Education)', queryKeyword: 'Warangal Telangana' },
          { value: 'karimnagar', label: 'Karimnagar (Granite & Agro-Trade)', queryKeyword: 'Karimnagar Telangana' },
          { value: 'nizamabad', label: 'Nizamabad (Turmeric & Commercial)', queryKeyword: 'Nizamabad Telangana' },
          { value: 'khammam', label: 'Khammam (Mining & Granite)', queryKeyword: 'Khammam Telangana' },
        ],
      },
      {
        value: 'TN',
        label: 'Tamil Nadu',
        cities: [
          { value: 'all_tn', label: 'All Districts in Tamil Nadu', queryKeyword: 'Tamil Nadu India' },
          { value: 'chennai', label: 'Chennai (Detroit of South Asia & SaaS)', queryKeyword: 'Chennai Tamil Nadu' },
          { value: 'coimbatore', label: 'Coimbatore (Pumps, Textiles & Engineering)', queryKeyword: 'Coimbatore Tamil Nadu' },
          { value: 'madurai', label: 'Madurai (Automotive & Commercial)', queryKeyword: 'Madurai Tamil Nadu' },
          { value: 'tiruchirappalli', label: 'Tiruchirappalli / Trichy (Fabrication)', queryKeyword: 'Trichy Tiruchirappalli Tamil Nadu' },
          { value: 'salem', label: 'Salem (Steel, Sago & Textiles)', queryKeyword: 'Salem Tamil Nadu' },
          { value: 'tiruppur', label: 'Tiruppur (Knitwear Capital of India)', queryKeyword: 'Tirupur Tiruppur Tamil Nadu' },
          { value: 'erode', label: 'Erode (Turmeric & Textile Market)', queryKeyword: 'Erode Tamil Nadu' },
          { value: 'vellore', label: 'Vellore (Leather, Auto & Medical)', queryKeyword: 'Vellore Tamil Nadu' },
        ],
      },
      {
        value: 'AP',
        label: 'Andhra Pradesh',
        cities: [
          { value: 'all_ap', label: 'All Districts in Andhra Pradesh', queryKeyword: 'Andhra Pradesh India' },
          { value: 'visakhapatnam', label: 'Visakhapatnam (Vizag Port & IT)', queryKeyword: 'Visakhapatnam Vizag Andhra Pradesh' },
          { value: 'vijayawada', label: 'Vijayawada & Amaravati (Commercial Hub)', queryKeyword: 'Vijayawada Andhra Pradesh' },
          { value: 'guntur', label: 'Guntur (Chilli & Tobacco Capital)', queryKeyword: 'Guntur Andhra Pradesh' },
          { value: 'tirupati', label: 'Tirupati (Electronics & Tourism)', queryKeyword: 'Tirupati Andhra Pradesh' },
          { value: 'nellore', label: 'Nellore (Aqua & Port Infrastructure)', queryKeyword: 'Nellore Andhra Pradesh' },
          { value: 'kakinada', label: 'Kakinada (Deepwater Port & Oil/Gas)', queryKeyword: 'Kakinada Andhra Pradesh' },
          { value: 'kurnool', label: 'Kurnool (Solar & Minerals)', queryKeyword: 'Kurnool Andhra Pradesh' },
        ],
      },
      {
        value: 'WB',
        label: 'West Bengal',
        cities: [
          { value: 'all_wb', label: 'All Districts in West Bengal', queryKeyword: 'West Bengal India' },
          { value: 'kolkata', label: 'Kolkata (Financial & Trade Capital of East)', queryKeyword: 'Kolkata West Bengal' },
          { value: 'howrah', label: 'Howrah (Foundry & Light Engineering)', queryKeyword: 'Howrah West Bengal' },
          { value: 'durgapur', label: 'Durgapur (Steel & Industrial City)', queryKeyword: 'Durgapur West Bengal' },
          { value: 'asansol', label: 'Asansol (Coal & Heavy Industry)', queryKeyword: 'Asansol West Bengal' },
          { value: 'siliguri', label: 'Siliguri (Tea, Logistics & North-East Gate)', queryKeyword: 'Siliguri West Bengal' },
          { value: 'haldia', label: 'Haldia (Port & Petrochemicals)', queryKeyword: 'Haldia West Bengal' },
        ],
      },
      {
        value: 'BR',
        label: 'Bihar',
        cities: [
          { value: 'all_br', label: 'All Districts in Bihar', queryKeyword: 'Bihar India' },
          { value: 'patna', label: 'Patna (Capital, Commerce & IT)', queryKeyword: 'Patna Bihar' },
          { value: 'gaya', label: 'Gaya (Tourism & Education Hub)', queryKeyword: 'Gaya Bihar' },
          { value: 'muzaffarpur', label: 'Muzaffarpur (Commercial Capital of North Bihar)', queryKeyword: 'Muzaffarpur Bihar' },
          { value: 'bhagalpur', label: 'Bhagalpur (Silk City & Agro)', queryKeyword: 'Bhagalpur Bihar' },
          { value: 'purnia', label: 'Purnia (Grain & Jute Hub)', queryKeyword: 'Purnia Bihar' },
          { value: 'darbhanga', label: 'Darbhanga (Medical & Aviation)', queryKeyword: 'Darbhanga Bihar' },
        ],
      },
      {
        value: 'OD',
        label: 'Odisha',
        cities: [
          { value: 'all_od', label: 'All Districts in Odisha', queryKeyword: 'Odisha India' },
          { value: 'bhubaneswar', label: 'Bhubaneswar (Capital, Smart City & IT)', queryKeyword: 'Bhubaneswar Odisha' },
          { value: 'cuttack', label: 'Cuttack (Silver City & Commercial)', queryKeyword: 'Cuttack Odisha' },
          { value: 'rourkela', label: 'Rourkela (Steel City of Odisha)', queryKeyword: 'Rourkela Odisha' },
          { value: 'berhampur', label: 'Berhampur (Silk & South Odisha Hub)', queryKeyword: 'Berhampur Odisha' },
          { value: 'sambalpur', label: 'Sambalpur (Aluminium & Power)', queryKeyword: 'Sambalpur Odisha' },
          { value: 'jharsuguda', label: 'Jharsuguda (Power & Metal Hub)', queryKeyword: 'Jharsuguda Odisha' },
        ],
      },
      {
        value: 'PB',
        label: 'Punjab',
        cities: [
          { value: 'all_pb', label: 'All Districts in Punjab', queryKeyword: 'Punjab India' },
          { value: 'ludhiana', label: 'Ludhiana (Manchester of India, Bicycles & Woolens)', queryKeyword: 'Ludhiana Punjab' },
          { value: 'amritsar', label: 'Amritsar (Tourism, Textiles & Food)', queryKeyword: 'Amritsar Punjab' },
          { value: 'jalandhar', label: 'Jalandhar (Sports Goods, Leather & Auto Parts)', queryKeyword: 'Jalandhar Punjab' },
          { value: 'patiala', label: 'Patiala (Education & Aviation)', queryKeyword: 'Patiala Punjab' },
          { value: 'bathinda', label: 'Bathinda (Refinery & Petrochemicals)', queryKeyword: 'Bathinda Punjab' },
          { value: 'mohali', label: 'Mohali / SAS Nagar (IT & Biotech)', queryKeyword: 'Mohali SAS Nagar Punjab' },
        ],
      },
      {
        value: 'HR',
        label: 'Haryana',
        cities: [
          { value: 'all_hr', label: 'All Districts in Haryana', queryKeyword: 'Haryana India' },
          { value: 'gurugram', label: 'Gurugram (Cyber Capital & Startups)', queryKeyword: 'Gurugram Haryana' },
          { value: 'faridabad', label: 'Faridabad (Heavy Industrial City)', queryKeyword: 'Faridabad Haryana' },
          { value: 'panipat', label: 'Panipat (Textile City & Refinery)', queryKeyword: 'Panipat Haryana' },
          { value: 'ambala', label: 'Ambala (Scientific Instruments & Mixers)', queryKeyword: 'Ambala Haryana' },
          { value: 'karnal', label: 'Karnal (Agri-Tech & Rice Capital)', queryKeyword: 'Karnal Haryana' },
          { value: 'hisar', label: 'Hisar (Steel & Pipe Capital)', queryKeyword: 'Hisar Haryana' },
          { value: 'sonipat', label: 'Sonipat & Kundli (Food & Education)', queryKeyword: 'Sonipat Haryana' },
        ],
      },
      {
        value: 'JH',
        label: 'Jharkhand',
        cities: [
          { value: 'all_jh', label: 'All Districts in Jharkhand', queryKeyword: 'Jharkhand India' },
          { value: 'ranchi', label: 'Ranchi (Capital & Heavy Engineering)', queryKeyword: 'Ranchi Jharkhand' },
          { value: 'jamshedpur', label: 'Jamshedpur (Steel City of India / TATA)', queryKeyword: 'Jamshedpur Jharkhand' },
          { value: 'dhanbad', label: 'Dhanbad (Coal Capital of India)', queryKeyword: 'Dhanbad Jharkhand' },
          { value: 'bokaro', label: 'Bokaro Steel City', queryKeyword: 'Bokaro Jharkhand' },
          { value: 'deoghar', label: 'Deoghar (Tourism & Healthcare)', queryKeyword: 'Deoghar Jharkhand' },
          { value: 'hazaribagh', label: 'Hazaribagh District', queryKeyword: 'Hazaribagh Jharkhand' },
        ],
      },
      {
        value: 'KL',
        label: 'Kerala',
        cities: [
          { value: 'all_kl', label: 'All Districts in Kerala', queryKeyword: 'Kerala India' },
          { value: 'kochi', label: 'Kochi / Ernakulam (Commercial Capital & Port)', queryKeyword: 'Kochi Ernakulam Kerala' },
          { value: 'thiruvananthapuram', label: 'Thiruvananthapuram (Capital & Technopark)', queryKeyword: 'Thiruvananthapuram Trivandrum Kerala' },
          { value: 'kozhikode', label: 'Kozhikode / Calicut (Trade & Cyberpark)', queryKeyword: 'Kozhikode Calicut Kerala' },
          { value: 'thrissur', label: 'Thrissur (Gold, Banking & Culture)', queryKeyword: 'Thrissur Kerala' },
          { value: 'kannur', label: 'Kannur (Handlooms & Powerlooms)', queryKeyword: 'Kannur Kerala' },
        ],
      },
      {
        value: 'UK',
        label: 'Uttarakhand',
        cities: [
          { value: 'all_uk', label: 'All Districts in Uttarakhand', queryKeyword: 'Uttarakhand India' },
          { value: 'dehradun', label: 'Dehradun (Capital & Education Hub)', queryKeyword: 'Dehradun Uttarakhand' },
          { value: 'haridwar', label: 'Haridwar (SIDCUL Industrial Park)', queryKeyword: 'Haridwar SIDCUL Uttarakhand' },
          { value: 'pantnagar', label: 'Pantnagar & Rudrapur (Auto & FMCG Hub)', queryKeyword: 'Rudrapur Pantnagar Uttarakhand' },
          { value: 'haldwani', label: 'Haldwani & Nainital (Kumaon Gate)', queryKeyword: 'Haldwani Uttarakhand' },
        ],
      },
      {
        value: 'HP',
        label: 'Himachal Pradesh',
        cities: [
          { value: 'all_hp', label: 'All Districts in Himachal Pradesh', queryKeyword: 'Himachal Pradesh India' },
          { value: 'baddi', label: 'Baddi-Barotiwala-Nalagarh (Pharma Capital)', queryKeyword: 'Baddi Nalagarh Himachal Pradesh' },
          { value: 'shimla', label: 'Shimla (Capital & Tourism)', queryKeyword: 'Shimla Himachal Pradesh' },
          { value: 'dharamshala', label: 'Dharamshala & Kangra', queryKeyword: 'Dharamshala Kangra Himachal Pradesh' },
          { value: 'solan', label: 'Solan (Mushroom City & Education)', queryKeyword: 'Solan Himachal Pradesh' },
        ],
      },
      {
        value: 'AS',
        label: 'Assam & North East',
        cities: [
          { value: 'all_as', label: 'All Districts in Assam & NE', queryKeyword: 'Assam North East India' },
          { value: 'guwahati', label: 'Guwahati (Gateway to North-East)', queryKeyword: 'Guwahati Kamrup Assam' },
          { value: 'dibrugarh', label: 'Dibrugarh (Tea & Oil City)', queryKeyword: 'Dibrugarh Assam' },
          { value: 'silchar', label: 'Silchar (Barak Valley Commercial)', queryKeyword: 'Silchar Assam' },
          { value: 'jorhat', label: 'Jorhat (Tea Capital)', queryKeyword: 'Jorhat Assam' },
        ],
      },
      {
        value: 'GA',
        label: 'Goa',
        cities: [
          { value: 'all_ga', label: 'All Goa', queryKeyword: 'Goa India' },
          { value: 'north_goa', label: 'North Goa (Panaji, Mapusa, Tourism & Tech)', queryKeyword: 'Panaji North Goa' },
          { value: 'south_goa', label: 'South Goa (Margao, Vasco, Port & Pharma)', queryKeyword: 'Margao Vasco South Goa' },
        ],
      },
    ],
  },
  {
    value: 'AE',
    label: 'United Arab Emirates (UAE)',
    flag: '🇦🇪',
    track: 'foreign',
    states: [
      {
        value: 'DXB',
        label: 'Dubai',
        cities: [
          { value: 'dubai_all', label: 'Dubai (All Sectors)', queryKeyword: 'Dubai UAE site:ae' },
          { value: 'business_bay', label: 'Business Bay & Downtown (Startups)', queryKeyword: 'Business Bay Dubai UAE site:ae' },
          { value: 'jafza_industrial', label: 'JAFZA & Al Quoz (Logistics/Industrial)', queryKeyword: 'JAFZA Al Quoz Dubai UAE site:ae' },
          { value: 'internet_city', label: 'Dubai Internet City & Silicon Oasis', queryKeyword: 'Dubai Internet City Silicon Oasis UAE site:ae' },
        ],
      },
      {
        value: 'AUH',
        label: 'Abu Dhabi',
        cities: [
          { value: 'abu_dhabi_all', label: 'Abu Dhabi City (Corporate & Energy)', queryKeyword: 'Abu Dhabi UAE site:ae' },
          { value: 'kizad_port', label: 'KIZAD / Khalifa Port (Logistics)', queryKeyword: 'KIZAD Abu Dhabi UAE site:ae' },
        ],
      },
      {
        value: 'SHJ',
        label: 'Sharjah',
        cities: [
          { value: 'sharjah_ind', label: 'Sharjah Industrial Areas', queryKeyword: 'Sharjah UAE site:ae' },
        ],
      },
    ],
  },
  {
    value: 'SA',
    label: 'Saudi Arabia (KSA)',
    flag: '🇸🇦',
    track: 'foreign',
    states: [
      {
        value: 'RIY',
        label: 'Riyadh Region',
        cities: [
          { value: 'riyadh_city', label: 'Riyadh City (Capital & FinTech)', queryKeyword: 'Riyadh Saudi Arabia site:sa' },
          { value: 'kafd', label: 'KAFD Financial District', queryKeyword: 'KAFD Riyadh Saudi Arabia site:sa' },
        ],
      },
      {
        value: 'MKH',
        label: 'Makkah / Western',
        cities: [
          { value: 'jeddah_city', label: 'Jeddah (Port & Commercial Hub)', queryKeyword: 'Jeddah Saudi Arabia site:sa' },
        ],
      },
      {
        value: 'EAS',
        label: 'Eastern Province',
        cities: [
          { value: 'dammam_khobar', label: 'Dammam & Al Khobar (Logistics/Oil)', queryKeyword: 'Dammam Khobar Saudi Arabia site:sa' },
        ],
      },
    ],
  },
  {
    value: 'US',
    label: 'United States (USA)',
    flag: '🇺🇸',
    track: 'foreign',
    states: [
      {
        value: 'CA',
        label: 'California',
        cities: [
          { value: 'sf_bay', label: 'San Francisco Bay / Silicon Valley', queryKeyword: 'San Francisco Silicon Valley California site:us OR site:com' },
          { value: 'la_oc', label: 'Los Angeles & Orange County', queryKeyword: 'Los Angeles California site:us OR site:com' },
          { value: 'san_diego', label: 'San Diego Tech', queryKeyword: 'San Diego California site:us OR site:com' },
        ],
      },
      {
        value: 'TX',
        label: 'Texas',
        cities: [
          { value: 'austin', label: 'Austin (Silicon Hills)', queryKeyword: 'Austin Texas site:us OR site:com' },
          { value: 'dallas', label: 'Dallas-Fort Worth (Enterprise)', queryKeyword: 'Dallas Fort Worth Texas site:us OR site:com' },
          { value: 'houston', label: 'Houston (Industrial & Energy)', queryKeyword: 'Houston Texas site:us OR site:com' },
        ],
      },
      {
        value: 'NY',
        label: 'New York',
        cities: [
          { value: 'nyc', label: 'New York City (FinTech & Media)', queryKeyword: 'New York City NYC site:us OR site:com' },
        ],
      },
    ],
  },
  {
    value: 'GB',
    label: 'United Kingdom (UK)',
    flag: '🇬🇧',
    track: 'foreign',
    states: [
      {
        value: 'LDN',
        label: 'Greater London',
        cities: [
          { value: 'london', label: 'London (FinTech & Startups)', queryKeyword: 'London UK site:co.uk' },
        ],
      },
      {
        value: 'MID',
        label: 'West Midlands',
        cities: [
          { value: 'birmingham', label: 'Birmingham (Logistics & Industry)', queryKeyword: 'Birmingham West Midlands UK site:co.uk' },
        ],
      },
      {
        value: 'MAN',
        label: 'Greater Manchester',
        cities: [
          { value: 'manchester', label: 'Manchester (Digital & Agency)', queryKeyword: 'Manchester UK site:co.uk' },
        ],
      },
    ],
  },
];

export const LOCAL_SECTOR_OPTIONS: SectorOption[] = [
  { value: 'education', label: 'Colleges & Coaching Institutes', baseQuery: 'engineering management colleges coaching institutes' },
  { value: 'schools', label: 'Schools & Educational Academies', baseQuery: 'CBSE ICSE international schools academies' },
  { value: 'healthcare', label: 'Hospitals, Clinics & Diagnostic Labs', baseQuery: 'multispeciality hospitals private clinics diagnostic imaging center' },
  { value: 'steel', label: 'Steel, Iron & Sponge Power Plants', baseQuery: 'steel rolling mills sponge iron ferro alloys manufacturing' },
  { value: 'logistics', label: 'Logistics, Transport & Supply Chain', baseQuery: 'logistics transport services fleet movers warehouse' },
  { value: 'industrial', label: 'Industrial & Heavy Manufacturing', baseQuery: 'industrial manufacturing engineering plant fabrication unit' },
  { value: 'realestate', label: 'Real Estate Builders & Infra Developers', baseQuery: 'builders real estate developers commercial projects contractors' },
  { value: 'retail_auto', label: 'Automobile Dealers & Large Retail Showrooms', baseQuery: 'automobile dealers car bike showroom retail jewelry chains' },
  { value: 'agro_food', label: 'Rice Mills, Food & Agro Processing', baseQuery: 'rice mills agro processing food products dal mill cold storage' },
  { value: 'tech_it', label: 'IT Companies & Digital Tech Agencies', baseQuery: 'IT software companies web development digital marketing agency' },
  { value: 'solar', label: 'Solar & Clean Energy Installers', baseQuery: 'solar power rooftop installations EPC contractors renewable energy' },
  { value: 'hospitality', label: 'Hotels, Resorts & Banquet Venues', baseQuery: 'hotels luxury resorts banquet halls convention center' },
];

export const FOREIGN_SECTOR_OPTIONS: SectorOption[] = [
  { value: 'b2b_saas', label: 'B2B SaaS Startups (Next.js/React)', baseQuery: 'funded SaaS startups hiring React developers site:ae OR site:sa OR site:co.uk OR site:us OR site:com' },
  { value: 'tech_agencies', label: 'Digital & Tech Agencies (Offshore Team)', baseQuery: 'digital agency web development offshore team site:ae OR site:sa OR site:co.uk OR site:com' },
  { value: 'ai_automation', label: 'AI & Workflow Automation Prospects', baseQuery: 'AI automation agency workflow integration site:ae OR site:sa OR site:co.uk OR site:com' },
];

const outsideCountries = [
  'ukraine', 'bulgaria', 'canada', 'usa', 'united states', 'united kingdom',
  'germany', 'france', 'australia', 'singapore', 'dubai', 'uae',
  'zaporizhzhya', 'varna', 'vancouver', 'toronto', 'london', 'berlin'
];

const outsideCities = [
  'indore', 'delhi', 'new delhi', 'mumbai', 'bengaluru', 'bangalore',
  'chandigarh', 'pune', 'hyderabad', 'kolkata', 'ahmedabad', 'jaipur',
  'chennai', 'noida', 'gurugram', 'gurgaon', 'surat', 'vadodara',
  'nagpur', 'bhopal', 'gwalior', 'jabalpur', 'lucknow', 'kanpur',
  'patna', 'kyiv', ...outsideCountries
];

export function getEffectiveLocation(lead: any): string {
  const cityStr = (lead.city || '').trim();
  const addressStr = (lead.office_address || lead.officeAddress || '').trim();
  const companyStr = (lead.company_name || lead.companyName || '').trim();
  const addressLower = addressStr.toLowerCase();
  const cityLower = cityStr.toLowerCase();
  const searchable = `${cityLower} ${addressLower} ${companyStr.toLowerCase()}`;

  // 1. Unambiguous International Detection
  const addressIsInternational = outsideCountries.some((c) => searchable.includes(c));
  if (addressIsInternational) return addressStr || cityStr || 'International';

  // 2. Deterministic Postal PIN Codes
  if (/\b495[0-5]\d{2}\b/.test(searchable)) return 'Bilaspur';
  if (/\b4956[78]\d\b/.test(searchable)) return 'Korba';
  if (/\b496[01]\d{2}\b/.test(searchable)) return 'Raigarh';
  if (/\b(490\d{3}|491[0-2]\d{2})\b/.test(searchable)) return 'Bhilai';
  if (/\b(492\d{3}|493[12]\d{2})\b/.test(searchable)) return 'Raipur';

  // 3. Physical Office Landmark & City Specific Keywords
  if (['bilaspur', 'vyapar vihar', 'tifra', 'sirgitti', 'bodri', 'torwa', 'magarpara', 'kims hospital', 'cims', 'tarbahar', 'jarhabhata'].some((w) => searchable.includes(w))) {
    return 'Bilaspur';
  }
  if (['bhilai', 'durg', 'supela', 'charoda', 'kumhari', 'borai'].some((w) => searchable.includes(w))) {
    return 'Bhilai';
  }
  const otherCG = ['korba', 'rajnandgaon', 'raigarh', 'jagdalpur', 'ambikapur', 'dhamtari'].find((w) => searchable.includes(w));
  if (otherCG) {
    return otherCG.charAt(0).toUpperCase() + otherCG.slice(1);
  }
  if (['raipur', 'urla', 'siltara', 'tatibandh', 'pandri', 'telibandha', 'devendra nagar'].some((w) => searchable.includes(w))) {
    return 'Raipur';
  }

  // 4. Grounded City String fallback
  if (cityStr && !['raipur', 'null', 'none', 'unknown', 'n/a'].includes(cityLower)) {
    return cityStr;
  }
  if (cityStr && cityLower === 'raipur' && !addressLower.includes('bilaspur') && !addressLower.includes('bhilai') && !addressLower.includes('magarpara')) {
    return 'Raipur';
  }
  if (addressStr) return addressStr;
  return cityStr || 'Raipur';
}

export function isLeadInLocation(lead: any, loc: string): boolean {
  if (loc === 'all') return true;

  const effectiveStr = getEffectiveLocation(lead).toLowerCase();
  const companyStr = (lead.company_name || lead.companyName || '').trim().toLowerCase();

  // Check for outside classification
  const hasOutsideSignal = outsideCities.some((oc) => effectiveStr.includes(oc));
  const hasOutsideName = outsideCities.some((oc) =>
    companyStr.startsWith(oc + ' ') || companyStr.includes(' ' + oc + ' ') ||
    companyStr.endsWith(' ' + oc) || companyStr.includes(oc + ' infoline')
  );
  if (hasOutsideSignal || hasOutsideName) {
    return loc === 'other';
  }

  const matchIn = (terms: string[]) => terms.some((t) => effectiveStr.includes(t));
  const check = (terms: string[]) =>
    effectiveStr ? matchIn(terms) : terms.some((t) => companyStr.includes(t));

  if (loc === 'raipur') {
    return check([
      'raipur', 'urla', 'siltara', 'tatibandh', 'pandri',
      'telibandha', 'bhatagaon', 'heerapur', 'rawabhata',
      'sarora', 'kabir nagar', 'kumhari', 'fagwara', 'gondwara', 'abhanpur',
      '492001', '492002', '492003', '492004', '492005', '492006', '492007', '492008', '492009', '492010'
    ]);
  }
  if (loc === 'bhilai_durg') {
    return check([
      'bhilai', 'durg', 'supela', 'charoda', 'kumhari', 'borai',
      '490001', '490006', '490020', '490023', '491001'
    ]);
  }
  if (loc === 'bilaspur') {
    return check(['bilaspur', 'sirgitti', 'tifra', 'bodri', 'vyapar vihar', 'magarpara', 'kims hospital', '495001']);
  }
  if (loc === 'chhattisgarh') {
    const isMainThree = isLeadInLocation(lead, 'raipur') || isLeadInLocation(lead, 'bhilai_durg') || isLeadInLocation(lead, 'bilaspur');
    if (isMainThree) return false;
    return check(['chhattisgarh', 'korba', 'rajnandgaon', 'raigarh', 'jagdalpur', 'ambikapur', 'dhamtari']);
  }
  if (loc === 'other') {
    const isAnyCG = isLeadInLocation(lead, 'raipur') || isLeadInLocation(lead, 'bhilai_durg') ||
                    isLeadInLocation(lead, 'bilaspur') || isLeadInLocation(lead, 'chhattisgarh');
    return !isAnyCG;
  }
  return check([loc.toLowerCase()]);
}
