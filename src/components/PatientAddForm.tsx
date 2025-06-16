"use client";

import { useState } from "react";
import { MockPatient } from "../data/mockData";
import Button from "./ui/Button";

interface PatientAddFormProps {
    patients: MockPatient[];
    setPatients: React.Dispatch<React.SetStateAction<MockPatient[]>>;
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PatientAddForm({
    patients,
    setPatients,
    setShowForm
}: PatientAddFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        budget: 30,
        maxDose: 20,
        age: 60,
        weeksSinceStroke: 4,
        leftStroke: true,
        male: true,
        horizon: 12,
        past: true,
        outcomes: [2.0],
        actions: [10]
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newPatient: Omit<MockPatient, 'id'> = {
            ...formData,
            outcomes: formData.outcomes,
            actions: formData.actions
        };
        setPatients([...patients, { ...newPatient, id: String(patients.length + 1) }]);
        setShowForm(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-6">Add New Patient</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age
                    </label>
                    <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weeks Since Stroke
                    </label>
                    <input
                        type="number"
                        name="weeksSinceStroke"
                        value={formData.weeksSinceStroke}
                        onChange={handleChange}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget (hours)
                    </label>
                    <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Dose (hours)
                    </label>
                    <input
                        type="number"
                        name="maxDose"
                        value={formData.maxDose}
                        onChange={handleChange}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horizon (weeks)
                    </label>
                    <input
                        type="number"
                        name="horizon"
                        value={formData.horizon}
                        onChange={handleChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="leftStroke"
                            checked={formData.leftStroke}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        Left Side Stroke
                    </label>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="male"
                            checked={formData.male}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        Male
                    </label>
                </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowForm(false)}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                >
                    Add Patient
                </Button>
            </div>
        </form>
    );
}
