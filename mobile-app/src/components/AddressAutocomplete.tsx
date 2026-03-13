import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

interface AddressAutocompleteProps {
    placeholder: string;
    onSelect: (data: { description: string; location: { lat: number; lng: number } }) => void;
    value?: string;
}

const AddressAutocomplete = ({ placeholder, onSelect, value = '' }: AddressAutocompleteProps) => {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query && query.length > 2 && showResults) {
                searchPlaces(query);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    const searchPlaces = async (text: string) => {
        setLoading(true);
        try {
            // Limit to Nigeria (countrycodes=ng) and bias heavily to Kano State using a viewbox
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: text,
                    format: 'json',
                    addressdetails: 1,
                    limit: 8,
                    countrycodes: 'ng',
                    viewbox: '8.3,12.2,8.8,11.8', // Bounding box roughly around Kano
                    bounded: 1, // Restrict strictly to this box if possible, or strongly prefer it
                    'accept-language': 'en'
                },
                headers: {
                    'User-Agent': 'PrestigeDeliveryApp/1.0' // Nominatim requires a User-Agent
                }
            });
            setResults(response.data);
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: any) => {
        const location = {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
        };
        // Clean up the display string
        let description = item.display_name;
        // Optionally remove explicit "Nigeria" or postcodes to make it cleaner
        description = description.replace(/,\s*Nigeria\s*$/, '').replace(/,\s*\d{6}\s*,\s*Nigeria$/, '');

        setQuery(description);
        setShowResults(false);
        onSelect({ description, location });
    };

    return (
        <View className="relative z-50 mb-2">
            <Text className="text-gray-500 text-xs mb-1 uppercase">{placeholder}</Text>
            <TextInput
                className="border-b border-gray-200 py-2 text-gray-900 text-base"
                placeholder={placeholder}
                value={query}
                onChangeText={(text) => {
                    setQuery(text);
                    setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
            />
            {loading && (
                <View className="absolute right-0 top-8">
                    <ActivityIndicator size="small" color="#0284c7" />
                </View>
            )}

            {showResults && results.length > 0 && (
                <View className="absolute top-16 left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-lg max-h-48 z-50 elevation-5">
                    <View>
                        {results.map((item) => (
                            <TouchableOpacity
                                key={item.place_id.toString()}
                                className="p-3 border-b border-gray-50 active:bg-gray-100"
                                onPress={() => handleSelect(item)}
                            >
                                <Text className="text-sm text-gray-800" numberOfLines={2}>{item.display_name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};

export default AddressAutocomplete;
